#[path = "./lib/lib.rs"]
mod lib;
use std::process::exit;
use protobuf_json_mapping;
use lib::mls_tools::{self, mls_validation_request::{self}, mls_validation_response::ValidationResult, MlsValidationRequest};

fn main() {

    let arg_str = match std::env::args().nth(1) {
        Some(arg_str) => arg_str,
        None => {
            println!("missing json encoded protobuf");
            exit(1)
        }
    };

    if arg_str == "version" {
        println!("1.0.0");
        exit(0);
    }

    let request: MlsValidationRequest = match protobuf_json_mapping::parse_from_str(&arg_str) {
        Ok(request) => request,
        Err(e) => {
            println!("error parsing json encoded protobuf:{}", e);
            exit(1)
        }
    };

    let payload: mls_validation_request::Payload = match request.payload {
        Some(payload) => payload,
        None => {
            println!("missing payload");
            exit(1)
        }
    };
    
    match payload {
        mls_validation_request::Payload::Passthrough(_) => {
            let response = mls_tools::MlsValidationResponse {
                result: ValidationResult::VALID.into(),
                special_fields: Default::default(),
            };
            let string = protobuf_json_mapping::print_to_string(&response).unwrap();
            print!("{}", string);
        }
        mls_validation_request::Payload::InitialGroupInfoRequest(request) => {
            let response = lib::validate_initial_group_info_request(request);
            let string = protobuf_json_mapping::print_to_string(&response).unwrap();
            print!("{}", string);
        }
        mls_validation_request::Payload::ExternalJoinRequest(request) => {
            let response = lib::validate_external_join_request(request);
            let string = protobuf_json_mapping::print_to_string(&response).unwrap();
            print!("{}", string);
        }
    }
}
