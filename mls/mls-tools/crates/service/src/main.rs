use river_mls_protocol::{mls_server::MlsServer, InfoRequest, InfoResponse};

use std::path::Path;
#[cfg(unix)]
use tokio::net::UnixListener;
#[cfg(unix)]
use tokio_stream::wrappers::UnixListenerStream;

use tonic::{transport::Server, Request, Response, Status};
use river_mls_protocol::{InitialGroupInfoRequest, InitialGroupInfoResponse};

#[derive(Default, Debug)]
pub struct MlsService {}

#[tonic::async_trait]
impl river_mls_protocol::mls_server::Mls for MlsService {
    async fn initial_group_info(&self, request: Request<InitialGroupInfoRequest>)
        -> Result<Response<InitialGroupInfoResponse>, Status> {
        let request = request.into_inner();
        let response = river_mls::validate_initial_group_info_request(request);
        Ok(Response::new(response))
    }

    async fn external_join(&self, request: Request<river_mls_protocol::ExternalJoinRequest>)
        -> Result<Response<river_mls_protocol::ExternalJoinResponse>, Status> {
        let request = request.into_inner();
        let response = river_mls::validate_external_join_request(request);
        Ok(Response::new(response))
    }

    async fn info(&self, _: Request<InfoRequest>) -> Result<Response<InfoResponse>, Status> {
        let mut reply = InfoResponse::default();
        reply.graffiti = "MLS Service welcomes you".to_string();
        reply.git = env!("GIT_HASH").to_string();
        Ok(Response::new(reply))
    }
}


#[cfg(unix)]
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {

    let socket_name = std::env::args().nth(1).expect("expected socket name, for example /tmp/mls_service");
    let path = socket_name.as_str();
    std::fs::remove_file(path).unwrap_or_default();
    std::fs::create_dir_all(Path::new(path).parent().unwrap())?;

    let mls_service = MlsService::default();
    let uds = UnixListener::bind(path)?;
    let uds_stream = UnixListenerStream::new(uds);
    println!("MLS Service listening on {}", path);

    Server::builder()
        .add_service(MlsServer::new(mls_service))
        .serve_with_incoming(uds_stream)
        .await?;

    std::fs::remove_file(path)?;

    Ok(())
}

#[cfg(not(unix))]
fn main() {
    panic!("The `uds` example only works on unix systems!");
}