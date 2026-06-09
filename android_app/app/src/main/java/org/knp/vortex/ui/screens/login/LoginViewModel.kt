package org.knp.vortex.ui.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.AuthApi
import org.knp.vortex.data.remote.AuthRequest
import org.knp.vortex.data.repository.SettingsRepository
import javax.inject.Inject

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isRegistrationSuccess: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authApi: AuthApi,
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    val serverUrl = settingsRepository.serverUrl

    fun setServerUrl(url: String) {
        settingsRepository.setServerUrl(url)
    }

    fun loginOrRegister(username: String, password: String, isRegistering: Boolean, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null, isRegistrationSuccess = false)
            try {
                if (isRegistering) {
                    authApi.register(AuthRequest(username, password))
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Registration successful! Please login.",
                        isRegistrationSuccess = true
                    )
                } else {
                    val response = authApi.login(AuthRequest(username, password))
                    if (response.token != null) {
                        settingsRepository.setAuthToken(response.token)
                        onSuccess()
                    } else {
                        _uiState.value = _uiState.value.copy(isLoading = false, error = "Login failed: No token received.")
                    }
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message ?: "Connection error")
            }
        }
    }
}
