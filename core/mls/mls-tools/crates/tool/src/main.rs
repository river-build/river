use std::fs::File;
use std::io::BufReader;

use std::process::exit;
use river_mls_protocol::{mls_validation_request, MlsValidationRequest, MlsValidationResponse};
use river_mls_protocol::mls_validation_response::ValidationResult;

fn main() {

    let filename = match std::env::args().nth(1) {
        Some(arg_str) => arg_str,
        None => {
            println!("missing json encoded protobuf");
            exit(1)
        }
    };

    if filename == "version" {
        println!("1.0.0");
        exit(0);
    }

    let file = File::open(filename).unwrap();
    let reader = BufReader::new(file);
    let request: MlsValidationRequest = serde_json::from_reader(reader).unwrap();
    println!("{:#?}", request);
    let payload: mls_validation_request::Payload = request.payload.unwrap();

    match payload {
        mls_validation_request::Payload::Passthrough(_) => {
            let response = MlsValidationResponse {
                result: ValidationResult::Valid.into(),
            };
            // let string = protobuf_json_mapping::print_to_string(&response).unwrap();
            print!("{:?}", response);
        }
        mls_validation_request::Payload::InitialGroupInfoRequest(request) => {
            let response = river_mls::validate_initial_group_info_request(request);
            // let string = protobuf_json_mapping::print_to_string(&response).unwrap();
            print!("{:?}", response);
        }
        mls_validation_request::Payload::ExternalJoinRequest(request) => {
            let response = river_mls::validate_external_join_request(request);
            // let string = protobuf_json_mapping::print_to_string(&response).unwrap();
            print!("{:?}", response);
        }
    }
}
