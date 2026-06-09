package org.knp.vortex

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.knp.vortex.data.repository.SettingsRepository
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _isBiometricUnlocked = MutableStateFlow(false)
    val isBiometricUnlocked: StateFlow<Boolean> = _isBiometricUnlocked.asStateFlow()

    val authToken = settingsRepository.authToken

    fun isBiometricEnabled(): Boolean {
        return settingsRepository.isBiometricEnabled()
    }

    fun setBiometricUnlocked(unlocked: Boolean) {
        _isBiometricUnlocked.value = unlocked
    }

    fun hasServerToken(): Boolean {
        return settingsRepository.getAuthToken() != null
    }
}
