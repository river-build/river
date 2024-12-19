use river_mls_protocol::{msl_server::MslServer, InfoRequest, InfoResponse};

use std::path::Path;
#[cfg(unix)]
use tokio::net::UnixListener;
#[cfg(unix)]
use tokio_stream::wrappers::UnixListenerStream;

use tonic::{transport::Server, Request, Response, Status};
use river_mls_protocol::{InitialGroupInfoRequest, InitialGroupInfoResponse};

#[derive(Default, Debug)]
pub struct MslService {}

#[tonic::async_trait]
impl river_mls_protocol::msl_server::Msl for MslService {
    async fn initial_group_info(&self, request: Request<InitialGroupInfoRequest>)
        -> Result<Response<InitialGroupInfoResponse>, Status> {

        let request = request.into_inner();

        println!("request.group_info_message: ${:?}", request.group_info_message);
        println!("request.external_group_snapshot: ${:?}", request.external_group_snapshot);

        // Erik, this doesn't work because it used a wrapped request with a oneof field
        // while this is a root message. I think it is better that use a root message for
        // the request instead of single one with oneof.
        // let result = river_mls::validate_initial_group_info_request(request)
        let reply = InitialGroupInfoResponse::default();

        Ok(Response::new(reply))
    }

    async fn info(&self, _: Request<InfoRequest>) -> Result<Response<InfoResponse>, Status> {
        let mut reply = InfoResponse::default();
        reply.graffiti = "MLS Service welcomes you".to_string();
        Ok(Response::new(reply))
    }
}


#[cfg(unix)]
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = "/tmp/mls_service";
    std::fs::create_dir_all(Path::new(path).parent().unwrap())?;

    let msl_service = MslService::default();
    let uds = UnixListener::bind(path)?;
    let uds_stream = UnixListenerStream::new(uds);

    Server::builder()
        .add_service(MslServer::new(msl_service))
        .serve_with_incoming(uds_stream)
        .await?;

    std::fs::remove_file(path)?;

    Ok(())
}

#[cfg(not(unix))]
fn main() {
    panic!("The `uds` example only works on unix systems!");
}