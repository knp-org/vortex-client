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

    @POST("/api/v1/auth/register")
    suspend fun register(@Body request: AuthRequest): AuthResponse
}
