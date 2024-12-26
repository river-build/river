package main

/*
#cgo LDFLAGS: -L. -lmls_lib
#include <stdlib.h>
#include <stdint.h>

// Define the function prototype
int process_mls_request(const uint8_t* input, size_t input_len, uint8_t** output_ptr, size_t* output_len);
void free_bytes(uint8_t* ptr, size_t len);
*/
import "C"
import (
	"fmt"
	"log"
	"unsafe"

	"github.com/river-build/river/core/node/mls_service/mls_tools"
	"google.golang.org/protobuf/proto"
)

func main() {
	var outputPtr *C.uint8_t
	var outputLen C.size_t
	req := mls_tools.MlsRequest{
		Content: &mls_tools.MlsRequest_InitialGroupInfo{},
	}
	bytes, err := proto.Marshal(&req)
	if err != nil {
		log.Fatal("marshaling error: ", err)
		return
	}

	// Call the Rust function
	retCode := C.process_mls_request(
		(*C.uint8_t)(unsafe.Pointer(&bytes[0])),
		C.size_t(len(bytes)),
		&outputPtr,
		&outputLen,
	)

	defer C.free_bytes(outputPtr, outputLen)

	if retCode != 0 {
		fmt.Printf("Error calling Rust function: %d\n", retCode)
		return
	}

	// Convert the result to a Go slice
	output := C.GoBytes(unsafe.Pointer(outputPtr), C.int(outputLen))

	var result = mls_tools.InitialGroupInfoResponse{}

	err = proto.Unmarshal(output, &result)
	if err != nil {
		log.Fatal("unmarshaling error: ", err)
	}

	fmt.Printf("got result: %s\n", result.GetResult())
}
