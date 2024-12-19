#[path = "./mls_tools.rs"]
pub mod mls_tools;

use mls_tools::mls_validation_request::ExternalJoinRequest;
use mls_tools::mls_validation_request::InitialGroupInfoRequest;
use mls_tools::mls_validation_response::ValidationResult;
use mls_tools::MlsValidationResponse;
use mls_rs::extension::built_in::ExternalPubExt;
use mls_rs::external_client::ExternalSnapshot;
use protobuf::SpecialFields;
use mls_rs::external_client::builder::ExternalBaseConfig;
use mls_rs::external_client::builder::WithCryptoProvider as ExternalWithCryptoProvider;
use mls_rs::external_client::builder::WithIdentityProvider as ExternalWithIdentityProvider;
use mls_rs::external_client::ExternalClient;
use mls_rs::identity::basic::BasicIdentityProvider;

use mls_rs::MlsMessage;
use mls_rs_crypto_rustcrypto::RustCryptoProvider;
type ExternalConfig = ExternalWithIdentityProvider<
BasicIdentityProvider,
ExternalWithCryptoProvider<RustCryptoProvider, ExternalBaseConfig>,
>;

fn create_external_client() -> ExternalClient<ExternalConfig> {
    let crypto_provider = RustCryptoProvider::default();
    let external_client = ExternalClient::builder()
        .identity_provider(BasicIdentityProvider)
        .crypto_provider(crypto_provider)
        .build();
    return external_client
}

pub fn validate_initial_group_info_request(request: InitialGroupInfoRequest) -> MlsValidationResponse {
    let external_client = create_external_client();
    let group_info_message = match MlsMessage::from_bytes(&request.group_info_message) {
        Ok(group_info_message) => group_info_message,
        Err(_) => return MlsValidationResponse { result: ValidationResult::INVALID_GROUP_INFO.into(), special_fields: SpecialFields::default() }
    };

    let external_group_snapshot = match ExternalSnapshot::from_bytes(&request.external_group_snapshot) {
        Ok(external_group_snapshot) => external_group_snapshot,
        Err(_) => return MlsValidationResponse { 
            result: ValidationResult::INVALID_EXTERNAL_GROUP.into(), 
            special_fields: SpecialFields::default() 
        }
    };
    
    let external_group = match external_client.load_group(external_group_snapshot) {
        Ok(group) => group,
        Err(_) => return MlsValidationResponse { 
            result: ValidationResult::INVALID_EXTERNAL_GROUP.into(), 
            special_fields: SpecialFields::default() 
        }
    };

    let group_info = match group_info_message.into_group_info() {
        Some(group_info) => group_info,
        None => return MlsValidationResponse { 
            result: ValidationResult::INVALID_GROUP_INFO.into(), 
            special_fields: SpecialFields::default() 
        }
    };

    if group_info.group_context().epoch() != 0 {
        return MlsValidationResponse {
            result: ValidationResult::INVALID_GROUP_INFO_EPOCH.into(),
            special_fields: SpecialFields::default(),
        };
    }

    if external_group.group_context().epoch() != 0 {
        return MlsValidationResponse {
            result: ValidationResult::INVALID_EXTERNAL_GROUP_EPOCH.into(),
            special_fields: SpecialFields::default(),
        };
    }

    match group_info.extensions().get_as::<ExternalPubExt>() {
        Ok(extensions) => {        
            match extensions {
                Some(_) => {}
                None => {
                    println!("no external pub extension");
                    return MlsValidationResponse {
                        result: ValidationResult::INVALID_GROUP_INFO_MISSING_PUB_KEY_EXTENSION.into(),
                        special_fields: SpecialFields::default(),
                    };
                }
            }
        }
        Err(_) => {
            return MlsValidationResponse {
                result: ValidationResult::INVALID_GROUP_INFO.into(),
                special_fields: SpecialFields::default(),
            };
        }
    }

    match external_group.export_tree() {
        Ok(_) => {}
        Err(_) => {
            return MlsValidationResponse {
                result: ValidationResult::INVALID_EXTERNAL_GROUP_MISSING_TREE.into(),
                special_fields: SpecialFields::default(),
            };
        }
    }
    return MlsValidationResponse {
        result: ValidationResult::VALID.into(),
        special_fields: SpecialFields::default(),
    };
}

pub fn validate_external_join_request(request: ExternalJoinRequest) -> MlsValidationResponse {

    let external_client = create_external_client();

    let external_group_snapshot = match ExternalSnapshot::from_bytes(&request.external_group_snapshot) {
        Ok(external_group_snapshot) => external_group_snapshot,
        Err(_) => return MlsValidationResponse { 
            result: ValidationResult::INVALID_EXTERNAL_GROUP.into(), 
            special_fields: SpecialFields::default() 
        }
    };

    let mut external_group = match external_client.load_group(external_group_snapshot) {
        Ok(group) => group,
        Err(_) => return MlsValidationResponse { 
            result: ValidationResult::INVALID_EXTERNAL_GROUP.into(), 
            special_fields: SpecialFields::default() 
        }
    };

    for commit_bytes in request.commits {
        let commit = match MlsMessage::from_bytes(&commit_bytes) {
            Ok(commit) => commit,
            Err(_) => return MlsValidationResponse { 
                result: ValidationResult::INVALID_COMMIT.into(), 
                special_fields: SpecialFields::default() 
            }
        };
        
        if external_group.process_incoming_message(commit).is_err() {
            return MlsValidationResponse {
                result: ValidationResult::INVALID_COMMIT.into(),
                special_fields: SpecialFields::default(),
            };
        }
    }

    let proposed_group_info_mls_message = match MlsMessage::from_bytes(&request.proposed_external_join_info_message) {
        Ok(group_info_message) => group_info_message,
        Err(_) => return MlsValidationResponse { 
            result: ValidationResult::INVALID_GROUP_INFO.into(), 
            special_fields: SpecialFields::default() 
        }
    };

    let proposed_group_info_message = match proposed_group_info_mls_message.into_group_info() {
        Some(group_info) => group_info,
        None => return MlsValidationResponse { 
            result: ValidationResult::INVALID_GROUP_INFO.into(), 
            special_fields: SpecialFields::default() 
        }
    };
    
    if proposed_group_info_message.group_context().epoch() != external_group.group_context().epoch() + 1 {
        return MlsValidationResponse {
            result: ValidationResult::INVALID_GROUP_INFO_EPOCH.into(),
            special_fields: SpecialFields::default(),
        };
    }

    let proposed_external_join_commit = match MlsMessage::from_bytes(&request.proposed_external_join_commit) {
        Ok(commit) => commit,
        Err(_) => return MlsValidationResponse { 
            result: ValidationResult::INVALID_COMMIT.into(), 
            special_fields: SpecialFields::default() 
        }
    };

    if proposed_external_join_commit.epoch() != Some(external_group.group_context().epoch()) {
        return MlsValidationResponse {
            result: ValidationResult::INVALID_GROUP_INFO_EPOCH.into(),
            special_fields: SpecialFields::default(),
        };
    }

    return MlsValidationResponse {
        result: ValidationResult::VALID.into(),
        special_fields: SpecialFields::default(),
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use mls_rs::group::ExportedTree;
    use mls_rs::{
        crypto::SignatureSecretKey,
        client_builder::{BaseConfig, WithCryptoProvider, WithIdentityProvider},
        identity::{
            basic::BasicCredential,
            SigningIdentity,
        },
        CipherSuite, CipherSuiteProvider, CryptoProvider, Client
    };
    const CIPHERSUITE: CipherSuite = CipherSuite::P256_AES128;
    use mls_rs::mls_rules::{CommitOptions, DefaultMlsRules};
    type Config = WithIdentityProvider<BasicIdentityProvider, WithCryptoProvider<RustCryptoProvider, BaseConfig>>;
    type ProviderCipherSuite = <RustCryptoProvider as CryptoProvider>::CipherSuiteProvider;

    fn cipher_suite_provider(
        crypto_provider: &RustCryptoProvider,
    ) -> ProviderCipherSuite {
        crypto_provider
            .cipher_suite_provider(CIPHERSUITE)
            .unwrap()
    }

    fn make_identity(
        crypto_provider: &RustCryptoProvider,
        name: &[u8],
    ) -> (SignatureSecretKey, SigningIdentity) {
        let cipher_suite = cipher_suite_provider(crypto_provider);
        let (secret, public) = cipher_suite.signature_key_generate().unwrap();
        
        let basic_identity = BasicCredential::new(name.to_vec());
        let signing_identity = SigningIdentity::new(basic_identity.into_credential(), public);
        (secret, signing_identity)
    }

    fn create_client(name: String) -> Client<Config> {
        let crypto_provider = RustCryptoProvider::default();
        let (secret, signing_identity) = make_identity(&crypto_provider, name.as_bytes());
        let commit_options = CommitOptions::default().with_ratchet_tree_extension(true).with_allow_external_commit(true);
        let mls_rules = DefaultMlsRules::default().with_commit_options(commit_options);

        let client = Client::builder()
            .identity_provider(BasicIdentityProvider)
            .crypto_provider(crypto_provider)
            .signing_identity(signing_identity, secret, CIPHERSUITE).mls_rules(mls_rules)
            .build();
        client
    }

    #[test]
    fn test_validate_initial_group_info_request_valid() {
        let bob_client = create_client("bob".to_string());
        let bob_group = bob_client.create_group(Default::default(), Default::default()).unwrap();
        let bob_group_info_message = bob_group.group_info_message_allowing_ext_commit(false).unwrap();

        let external_client = create_external_client();
        let tree_bytes = bob_group.export_tree().to_bytes().unwrap();
        let tree = ExportedTree::from_bytes(&tree_bytes).unwrap();
        let external_group = external_client.observe_group(bob_group_info_message.clone(), Some(tree)).unwrap();
        let external_group_snapshot = external_group.snapshot();

        let request = InitialGroupInfoRequest {
            group_info_message: bob_group_info_message.to_bytes().unwrap(),
            external_group_snapshot: external_group_snapshot.to_bytes().unwrap(),
            special_fields: SpecialFields::default(),
        };

        let response = validate_initial_group_info_request(request);
        assert_eq!(response.result, ValidationResult::VALID.into());
    }

    #[test]
    fn test_validate_initial_group_info_request_invalid_group_info() {
        let bob_client = create_client("bob".to_string());
        let bob_group = bob_client.create_group(Default::default(), Default::default()).unwrap();
        let bob_group_info_message = bob_group.group_info_message(false).unwrap();

        let external_client = create_external_client();
        let tree_bytes = bob_group.export_tree().to_bytes().unwrap();
        let tree = ExportedTree::from_bytes(&tree_bytes).unwrap();
        let external_group = external_client.observe_group(bob_group_info_message.clone(), Some(tree)).unwrap();
        let external_group_snapshot = external_group.snapshot();

        let request = InitialGroupInfoRequest {
            group_info_message: bob_group_info_message.to_bytes().unwrap(),
            external_group_snapshot: external_group_snapshot.to_bytes().unwrap(),
            special_fields: SpecialFields::default(),
        };

        let response = validate_initial_group_info_request(request);
        assert_eq!(response.result, ValidationResult::INVALID_GROUP_INFO_MISSING_PUB_KEY_EXTENSION.into());
    }

}
