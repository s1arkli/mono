package auth

type (
	RegisterRequest struct {
		Account  string `json:"account" binding:"required,min=6,max=20"`
		Password string `json:"password" binding:"required,min=6,max=20"`
	}

	LoginRequest struct {
		Account  string `json:"account" binding:"required,min=6,max=20"`
		Password string `json:"password" binding:"required,min=6,max=20"`
	}
)
