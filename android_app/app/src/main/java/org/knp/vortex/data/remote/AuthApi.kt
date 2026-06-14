package org.knp.vortex.data.remote

import retrofit2.http.Body
import retrofit2.http.POST

data class AuthRequest(
    val username: String,
    val password: String
)

data class AuthResponse(
    val token: String?,
    // Other fields can be added if needed, e.g. user details
)

interface AuthApi {
    @POST("/api/v1/auth/login")
    suspend fun login(@Body request: AuthRequest): AuthResponse

    // The server has no open registration. First-run only: /auth/setup creates the
    // initial admin and logs them in (returns a token), rejecting with 403 once a
    // user already exists.
    @POST("/api/v1/auth/setup")
    suspend fun register(@Body request: AuthRequest): AuthResponse
}
