package logging_test

import (
	"encoding/hex"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/node/logging"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/testutils"
	"github.com/river-build/river/core/node/testutils/testfmt"
)

type Data2 struct {
	Num       int
	Nums      []int
	Str       string
	Bytes     []byte
	MoreData  *Data2
	Map       map[string]string
	ByteMap   map[string][]byte
	DataMap   map[string]*Data2
	Bool      bool
	AndFalse  bool
	Eternity  time.Duration
	EmptyStr  string
}

func makeTestData2() *Data2 {
	return &Data2{
		Num:   1,
		Nums:  []int{1, 2, 3, 4, 5},
		Str:   "hello",
		Bytes: []byte("world hello"),
		MoreData: &Data2{
			Num:   2,
			Bytes: []byte("hello hello hello"),
			Map:   map[string]string{"hello": "world"},
		},
		Map: map[string]string{
			"aabbccdd":               "00112233445566778899",
			"0x00112233445566778899": "hello",
			"hello2":                 "world2",
			"world2":                 "hello2",
			"hello3":                 "world3",
			"world3":                 "hello3",
			"hello4":                 "world4",
			"world4":                 "hello4",
			"xx_empty":               "",
		},
		ByteMap:   map[string][]byte{"hello": []byte("world")},
		DataMap:   map[string]*Data2{"hello": {Num: 3}},
		Bool:      true,
		AndFalse:  false,
		Eternity: time.Hour,
	}
}

func TestZap(t *testing.T) {
	if !testfmt.Enabled() {
		t.SkipNow()
	}

	log := logging.DefaultZapLogger()

	data := makeTestData2()

	log.Errorw("Error example", "int", 33, "data", data, "str", "hello", "bytes", []byte("world"))
	fmt.Println()

	log.Named("group").With("with1", 1, "with2", 2).Infow("TestZap", "data", data, "int", 22)
	fmt.Println()

	log.Infow(
		"simple type examples",
		"hex_bytes", []byte{0x01, 0x02, 0x03, 0x04, 0x05},
		"long bytes", []byte("hello world"),
		"string", "hello world",
		"int", 33,
		"bool_true", true,
		"bool_false", false,
		"nil", nil,
		"float", 3.14,
		"duration", time.Minute,
	)
	require.NoError(t, log.Sync())
	fmt.Println()
}

type byteArray [10]byte

func TestByteType(t *testing.T) {
	assert := assert.New(t)

	log, buf := testutils.ZapJsonLogger()

	b := byteArray{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	log.Infow("byte array", "byte_array", b)
	assert.Contains(buf.String(), "0102030405060708090a")
}

func TestByteSliceType(t *testing.T) {
	assert := assert.New(t)

	log, buf := testutils.ZapJsonLogger()

	b := []byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

	log.Infow("byte slice", "byte_slice", b)
	assert.Contains(buf.String(), "0102030405060708090a")

}

func TestCommonAddress(t *testing.T) {
	assert := assert.New(t)

	log, buf := testutils.ZapJsonLogger()

	b := common.Address{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	log.Infow("byte array", "byte_array", b)
	assert.Contains(buf.String(), "0102030405060708090a00000000000000000000")
}

func TestMapWithCommonAddress(t *testing.T) {
	assert := assert.New(t)

	log, buf := testutils.ZapJsonLogger()

	mm := map[common.Address]string{
		{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}:          "hello",
		{11, 12, 13, 14, 15, 16, 17, 18, 19, 20}: "world",
	}

	log.Infow("byte array", "map", mm)

	assert.Contains(buf.String(), "0102030405060708090a00000000000000000000")
	assert.Contains(buf.String(), "0b0c0d0e0f101112131400000000000000000000")
	assert.Contains(buf.String(), "hello")
	assert.Contains(buf.String(), "world")
}

func bytesFromHex(s string) []byte {
	b, err := hex.DecodeString(s)
	if err != nil {
		panic(err)
	}
	return b
}

func TestShortHex(t *testing.T) {
	assert := assert.New(t)

	log, buf := testutils.ZapJsonLogger()

	type testParams struct {
		arg      any
		expected string
	}

	tests := []testParams{
		{"00112233445566778899", "00112233445566778899"},
		{"0x00112233445566778899", "0x00112233445566778899"},
		{"0011223344556677889900112233445566778899", "0011223344556677889900112233445566778899"},
		{"0x0011223344556677889900112233445566778899", "0x0011223344556677889900112233445566778899"},
		{"0011223344556677889900112233445566778899aa", "001122334455667788..2233445566778899aa"},
		{"0x0011223344556677889900112233445566778899aa", "0x001122334455667788..2233445566778899aa"},
		{bytesFromHex("00112233445566778899"), "00112233445566778899"},
		{bytesFromHex("0011223344556677889900112233445566778899"), "0011223344556677889900112233445566778899"},
		{bytesFromHex("0011223344556677889900112233445566778899aa"), "001122334455667788..2233445566778899aa"},
	}
	for _, test := range tests {
		buf.Reset()
		log.Infow("test", "hex", test.arg)
		assert.Contains(buf.String(), test.expected, "arg: %v", test.arg)
	}
}


func TestProtoBinaryStrings(t *testing.T) {
	// The byte string renders sanely, but the proto is missing nested brackets in the
	// final log response.
	envelope := &Envelope{
		Hash: []byte("2346ad27d7568ba9896f1b7da6b5991251debdf2"),
	}

	// Create a new logging logger that logs to a temp file in JSON format
	logger, buffer := testutils.ZapJsonLogger()

	logger.Infow("Logging envelope", "envelope", envelope)

	logOutput := buffer.String()
	logOutput = testutils.RemoveJsonTimestamp(string(logOutput))
	// os.WriteFile("testdata/envelope_json.txt", []byte(logOutput), 0644)

	expectedBytes, err := os.ReadFile("testdata/envelope_json.txt")
	require.NoError(t, err)
	expected := string(expectedBytes[:])

	// Compare the output with the expected output
	// The expected output contains a b64-encoded string of the Hash field above.
	fmt.Print(logOutput)
	require.Equal(t, expected, logOutput)
}
