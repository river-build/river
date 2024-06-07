// OLM_OPTIONS is undefined https://gitlab.matrix.org/matrix-org/olm/-/issues/10
// but this comment suggests we define it ourselves? https://gitlab.matrix.org/matrix-org/olm/-/blob/master/javascript/olm_pre.js#L22-24
globalThis.OLM_OPTIONS = {};
/**
 * Utilities common to Olm encryption
 */
// Supported algorithms
var Algorithm;
(function (Algorithm) {
    Algorithm["Olm"] = "r.olm.v1.curve25519-aes-sha2";
    Algorithm["GroupEncryption"] = "r.group-encryption.v1.aes-sha2";
})(Algorithm || (Algorithm = {}));
/**
 * river algorithm tag for olm
 */
export const OLM_ALGORITHM = Algorithm.Olm;
/**
 * river algorithm tag for group encryption
 */
export const GROUP_ENCRYPTION_ALGORITHM = Algorithm.GroupEncryption;
//# sourceMappingURL=olmLib.js.map