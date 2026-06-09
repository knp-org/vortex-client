package org.knp.vortex.data.remote

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.Response
import org.knp.vortex.data.repository.SettingsRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor(
    private val settingsRepository: SettingsRepository
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val originalUrl = originalRequest.url
        val token = settingsRepository.getAuthToken()
        val serverUrl = settingsRepository.getServerUrl().toHttpUrlOrNull()
        
        // Only attach token if the request is going to our server or the placeholder
        val isTargetingServer = originalUrl.host == "placeholder.local" || 
                              (serverUrl != null && originalUrl.host == serverUrl.host)

        if (token != null && isTargetingServer) {
            val newRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            return chain.proceed(newRequest)
        }
        
        return chain.proceed(originalRequest)
    }
}
