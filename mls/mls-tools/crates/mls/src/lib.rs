use mls_rs::extension::built_in::ExternalPubExt;
use mls_rs::external_client::*;
use mls_rs::MlsMessage;
use mls_rs::external_client::builder::ExternalBaseConfig;
use mls_rs::external_client::builder::WithCryptoProvider as ExternalWithCryptoProvider;
use mls_rs::external_client::builder::WithIdentityProvider as ExternalWithIdentityProvider;
use mls_rs::external_client::ExternalClient;
use mls_rs::identity::basic::BasicIdentityProvider;
use mls_rs_crypto_rustcrypto::RustCryptoProvider;

use river_mls_protocol::SnapshotExternalGroupRequest;
use river_mls_protocol::SnapshotExternalGroupResponse;
use river_mls_protocol::{InitialGroupInfoRequest, 
    InitialGroupInfoResponse, 
    ExternalJoinRequest, 
    ExternalJoinResponse, 
    ValidationResult
};

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

pub fn validate_initial_group_info_request(request: InitialGroupInfoRequest) -> InitialGroupInfoResponse {
    let external_client = create_external_client();
    let group_info_message = match MlsMessage::from_bytes(&request.group_info_message) {
        Ok(group_info_message) => group_info_message,
        Err(_) => return InitialGroupInfoResponse { result: ValidationResult::InvalidGroupInfo.into() }
    };

    let external_group_snapshot = match ExternalSnapshot::from_bytes(&request.external_group_snapshot) {
        Ok(external_group_snapshot) => external_group_snapshot,
        Err(_) => return InitialGroupInfoResponse {
            result: ValidationResult::InvalidExternalGroup.into(),
        }
    };

    let external_group = match external_client.load_group(external_group_snapshot) {
        Ok(group) => group,
        Err(_) => return InitialGroupInfoResponse {
            result: ValidationResult::InvalidExternalGroup.into(),
        }
    };

    let group_info = match group_info_message.into_group_info() {
        Some(group_info) => group_info,
        None => return InitialGroupInfoResponse {
            result: ValidationResult::InvalidGroupInfo.into(),
        }
    };

    if group_info.group_context().epoch() != 0 {
        return InitialGroupInfoResponse {
            result: ValidationResult::InvalidGroupInfoEpoch.into(),
        };
    }

    if external_group.group_context().epoch() != 0 {
        return InitialGroupInfoResponse {
            result: ValidationResult::InvalidExternalGroupEpoch.into(),
        };
    }

    if group_info.group_context().group_id() != external_group.group_context().group_id() {
        return InitialGroupInfoResponse {
            result: ValidationResult::InvalidGroupInfo.into(),
        };
    }

    match group_info.extensions().get_as::<ExternalPubExt>() {
        Ok(extensions) => {
            match extensions {
                Some(_) => {}
                None => {
                    println!("no external pub extension");
                    return InitialGroupInfoResponse {
                        result: ValidationResult::InvalidGroupInfoMissingPubKeyExtension.into(),
                    };
                }
            }
        }
        Err(_) => {
            return InitialGroupInfoResponse {
                result: ValidationResult::InvalidGroupInfo.into(),
            };
        }
    }

    match external_group.export_tree() {
        Ok(_) => {}
        Err(_) => {
            return InitialGroupInfoResponse {
                result: ValidationResult::InvalidExternalGroupMissingTree.into(),
            };
        }
    }
    return InitialGroupInfoResponse {
        result: ValidationResult::Valid.into(),
    };
}

pub fn validate_external_join_request(request: ExternalJoinRequest) -> ExternalJoinResponse {

    let external_client = create_external_client();

    let external_group_snapshot = match ExternalSnapshot::from_bytes(&request.external_group_snapshot) {
        Ok(external_group_snapshot) => external_group_snapshot,
        Err(_) => return ExternalJoinResponse {
            result: ValidationResult::InvalidExternalGroup.into(),
        }
    };

    let mut external_group = match external_client.load_group(external_group_snapshot) {
        Ok(group) => group,
        Err(_) => return ExternalJoinResponse {
            result: ValidationResult::InvalidExternalGroup.into(),
        }
    };

    for commit in request.commits {
        let commit = match MlsMessage::from_bytes(&commit.commit) {
            Ok(commit) => commit,
            Err(_) => return ExternalJoinResponse {
                result: ValidationResult::InvalidGroupInfoMissingPubKeyExtension.into(),
            }
        };

        if external_group.process_incoming_message(commit).is_err() {
            println!("Failed processing commit, this is potentially ok");
        }
    }

    let proposed_group_info_mls_message = match MlsMessage::from_bytes(&request.proposed_external_join_info_message) {
        Ok(group_info_message) => group_info_message,
        Err(_) => return ExternalJoinResponse {
            result: ValidationResult::InvalidGroupInfo.into(),
        }
    };

    let proposed_group_info_message = match proposed_group_info_mls_message.into_group_info() {
        Some(group_info) => group_info,
        None => return ExternalJoinResponse {
            result: ValidationResult::InvalidGroupInfo.into(),
        }
    };

    if proposed_group_info_message.group_context().epoch() != external_group.group_context().epoch() + 1 {
        return ExternalJoinResponse {
            result: ValidationResult::InvalidExternalGroupEpoch.into(),
        };
    }

    let proposed_external_join_commit = match MlsMessage::from_bytes(&request.proposed_external_join_commit) {
        Ok(commit) => commit,
        Err(_) => return ExternalJoinResponse {
            result: ValidationResult::InvalidExternalGroupMissingTree.into(),
        }
    };

    if proposed_external_join_commit.epoch() != Some(external_group.group_context().epoch()) {
        return ExternalJoinResponse {
            result: ValidationResult::InvalidExternalGroupEpoch.into(),
        };
    }

    if !external_group.process_incoming_message(proposed_external_join_commit.clone()).is_ok() {
        return ExternalJoinResponse {
            result: ValidationResult::InvalidExternalGroupEpoch.into(),
        };
    }

    return ExternalJoinResponse {
        result: ValidationResult::Valid.into(),
    };
}

pub fn snapshot_external_group(request: SnapshotExternalGroupRequest) -> SnapshotExternalGroupResponse {
    println!("About to snapshot {:?} commit count: {}", request.external_group_snapshot, request.commits.len());
    let external_client = create_external_client();
    let external_group_snapshot = match ExternalSnapshot::from_bytes(&request.external_group_snapshot) {
        Ok(external_group_snapshot) => external_group_snapshot,
        Err(_) => {
            println!("Failed getting external group 1");
            return SnapshotExternalGroupResponse { // this means trouble, what should we do?
                group_info_message: request.group_info_message,
                external_group_snapshot: request.external_group_snapshot,
            }
        }
    };

    let mut external_group = match external_client.load_group(external_group_snapshot) {
        Ok(group) => group,
        Err(_) => {
            println!("Failed getting external group 2");
            return SnapshotExternalGroupResponse { // this means trouble, what should we do?
                group_info_message: request.group_info_message,
                external_group_snapshot: request.external_group_snapshot,
            }
        }
    };
    
    let mut latest_valid_group_info_message = request.group_info_message.clone();
    for commit_and_group_info in request.commits {
        let commit = match MlsMessage::from_bytes(&commit_and_group_info.commit) {
            Ok(commit) => commit,
            Err(_) => { continue; }
        };

        if external_group.process_incoming_message(commit).is_ok() {
            println!("Processed commmit ok");
            match commit_and_group_info.updated_group_info_message {
                Some(group_info_message) => {
                    latest_valid_group_info_message = group_info_message;
                }
                None => {}
            }
        } else {
            println!("Failed processing commit");
        }
    }

    println!("snapshotting external group, all good so far");
    match external_group.snapshot().to_bytes() {
        Ok(snapshot_bytes) => {
            println!("returning snapshot");
            SnapshotExternalGroupResponse {
                group_info_message: latest_valid_group_info_message,
                external_group_snapshot: snapshot_bytes,
            }
        }
        Err(_) => {
            println!("FAILED returning snapshot");
            return SnapshotExternalGroupResponse {
                group_info_message: latest_valid_group_info_message,
                external_group_snapshot: request.external_group_snapshot,
            }
        }
    }
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
    use river_mls_protocol::Commit;
    type ClientConfig = WithIdentityProvider<BasicIdentityProvider, WithCryptoProvider<RustCryptoProvider, BaseConfig>>;
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

    fn create_client(name: String) -> Client<ClientConfig> {
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

    fn perform_external_join(external_group_snapshot: ExternalSnapshot, commits: Vec<Commit>, group_info_message: MlsMessage, client: Client<ClientConfig>) -> (MlsMessage, MlsMessage) {
        let external_client = create_external_client();
        let mut external_group = external_client.load_group(external_group_snapshot.clone()).unwrap();
        for commit in commits.iter() {
            let mls_message : MlsMessage = MlsMessage::from_bytes(&commit.commit).unwrap();
            external_group.process_incoming_message(mls_message).unwrap();
        }
        let tree_after_commits_bytes = external_group.export_tree().unwrap();
        let exported_tree_after_commits = ExportedTree::from_bytes(&tree_after_commits_bytes).unwrap();

        let client_builder = client.external_commit_builder().unwrap().with_tree_data(exported_tree_after_commits.clone());
        let (client_group, client_commit) = client_builder
            .build(group_info_message.clone())
            .unwrap();
        
        let group_info_message = client_group.group_info_message_allowing_ext_commit(false).unwrap();
        return (group_info_message, client_commit);
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
        };

        let response = validate_initial_group_info_request(request);
        assert_eq!(response.result, ValidationResult::Valid.into());
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
        };

        let response = validate_initial_group_info_request(request);
        assert_eq!(response.result, ValidationResult::InvalidGroupInfoMissingPubKeyExtension.into());
    }

    #[test]
    fn test_validate_external_join() {
        let bob_client = create_client("bob".to_string());
        let bob_group = bob_client.create_group(Default::default(), Default::default()).unwrap();
        let bob_group_info_message = bob_group.group_info_message_allowing_ext_commit(false).unwrap();

        let external_client = create_external_client();
        let tree_bytes = bob_group.export_tree().to_bytes().unwrap();
        let tree = ExportedTree::from_bytes(&tree_bytes).unwrap();

        let external_group = external_client.observe_group(bob_group_info_message.clone(), Some(tree)).unwrap();
        let external_group_snapshot = external_group.snapshot();
        let mut latest_group_info_message_without_tree = bob_group_info_message.clone();
        let mut commits: Vec<Commit> = Vec::new();

        // apply 10 external joins
        for i in 0..10 {
            let name = format!("client {}", i);
            let client = create_client(name);
            let (client_group_info_message, commit) = perform_external_join(external_group_snapshot.clone(), commits.clone(), latest_group_info_message_without_tree, client);
            commits.push(Commit{commit: commit.to_bytes().unwrap(), updated_group_info_message: Some(client_group_info_message.to_bytes().unwrap())});
            
            latest_group_info_message_without_tree = client_group_info_message;
        }

        let alice = create_client("alice".to_string());
        let (alice_group_info_message, alice_commit) = perform_external_join(external_group_snapshot.clone(), commits.clone(), latest_group_info_message_without_tree, alice);
        let request = ExternalJoinRequest {
            external_group_snapshot: external_group_snapshot.to_bytes().unwrap(),
            commits: commits,
            proposed_external_join_info_message: alice_group_info_message.to_bytes().unwrap(),
            proposed_external_join_commit: alice_commit.to_bytes().unwrap(),
        };
        let result = validate_external_join_request(request);
        assert_eq!(result.result, ValidationResult::Valid.into());
    }


    #[test]
    fn test_validate_epoch_stuff() {
        let bob_client = create_client("bob".to_string());
        let mut bob_group = bob_client.create_group(Default::default(), Default::default()).unwrap();
        let message: Vec<u8> = vec![1, 2, 3, 4];
        let bob_group_info_message = bob_group.group_info_message_allowing_ext_commit(true).unwrap();
        println!("before {}", bob_group.current_epoch());
        let encrypted = bob_group.encrypt_application_message(&message, Default::default()).unwrap();
        
        println!("after {}", bob_group.current_epoch());
        let external_client = create_external_client();
        let tree_bytes = bob_group.export_tree().to_bytes().unwrap();
        let tree = ExportedTree::from_bytes(&tree_bytes).unwrap();
        let mut external_group = external_client.observe_group(bob_group_info_message.clone(), Some(tree)).unwrap();
        
        // external_group.process_incoming_message(encrypted.clone()).unwrap();
        let external_group_snapshot = external_group.snapshot();
        let mut latest_group_info_message_without_tree = bob_group_info_message.clone();
        let mut commits: Vec<Commit> = Vec::new();
        
        let alice = create_client("alice".to_string());
        let (alice_group_info_message, alice_commit) = perform_external_join(external_group_snapshot.clone(), commits.clone(), latest_group_info_message_without_tree, alice);

        bob_group.process_incoming_message(alice_commit).unwrap();
    }
}
