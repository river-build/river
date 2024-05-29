package rpc

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/river-build/river/core/node/node/version"
	"github.com/river-build/river/core/node/rpc/render"
	"github.com/river-build/river/core/node/rpc/statusinfo"
)

func (s *Service) getStatusReponse() *statusinfo.StatusResponse {
	var addr string
	if s.wallet != nil {
		addr = s.wallet.Address.Hex()
	}
	return &statusinfo.StatusResponse{
		Status:     s.GetStatus(),
		InstanceId: s.instanceId,
		Address:    addr,
		Version:    version.GetFullVersion(),
		StartTime:  s.startTime.UTC().Format(time.RFC3339),
		Uptime:     time.Since(s.startTime).String(),
		Graffiti:   s.config.GetGraffiti(),
	}
}

func (s *Service) handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(s.getStatusReponse())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Service) handleInfo(w http.ResponseWriter, r *http.Request) {
	var output *bytes.Buffer

	json, err := json.MarshalIndent(s.getStatusReponse(), "", "  ")
	if err == nil {
		output, err = render.Execute(&render.InfoIndexData{StatusJson: string(json)})
	}
	if err != nil {
		s.defaultLogger.Error("unable to prepare info index response", "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, output)
}
