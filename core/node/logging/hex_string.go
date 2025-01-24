package logging

const (
	reverseHexTable = "" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\xff\xff\xff\xff\xff\xff" +
		"\xff\x0a\x0b\x0c\x0d\x0e\x0f\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\x0a\x0b\x0c\x0d\x0e\x0f\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff" +
		"\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff"
)

// IsHexString reports whether s consists of hexadecimal digits and whether it has 0x prefix.
func IsHexString(s string) (bool, bool) {
	if len(s) < 2 || (len(s)&1) != 0 {
		return false, false
	}

	start := 0
	prefix := false
	if s[0] == '0' && (s[1] == 'x' || s[1] == 'X') {
		start = 2
		prefix = true
	}

	for i := start; i < len(s); i++ {
		if reverseHexTable[s[i]] > 0x0f {
			return false, prefix
		}
	}
	return true, prefix
}

const (
	shortenHexBytes        = 20
	shortenHexChars        = shortenHexBytes * 2
	shortenHexCharsPartLen = shortenHexChars/2 - 2
)

// formatHexString will optionally shorten strings if they are determined to be parsable as
// hex and are past a threshold length. We return all components of the shortened string in
// order to avoid unnecessary copies.
func formatHexString(s string) (first string, middle string, last string, truncated bool) {
	hex, hasPrefix := IsHexString(s)
	if hex {
		if hasPrefix {
			if len(s) > (shortenHexChars + 2) {
				return s[:(2+shortenHexCharsPartLen)], "..", s[len(s)-shortenHexCharsPartLen:], true
			}
		} else {
			if len(s) > shortenHexChars {
				return s[:shortenHexCharsPartLen], "..", s[len(s)-shortenHexCharsPartLen:], true
			}
		}
	}
	return "", "", "", false
}