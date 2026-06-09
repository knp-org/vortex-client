package org.knp.vortex.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.PrimaryBlue

@Composable
fun ServerConfigScreen(
    onBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                GlassyTopBar(title = "Server Configuration", onBack = onBack)
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                org.knp.vortex.ui.components.GlassyTextField(
                    value = uiState.serverUrl,
                    onValueChange = { viewModel.updateServerUrl(it) },
                    label = "Server URL",
                    modifier = Modifier.fillMaxWidth()
                )

                Text(
                    text = "Enter the full URL of your media server (e.g., http://192.168.1.100:3000)",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = { viewModel.resetToDefault() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = Color.White
                        )
                    ) {
                        Text("Reset to Default")
                    }

                    Button(
                        onClick = { viewModel.saveSettings() },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PrimaryBlue
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Save")
                    }
                }

                if (uiState.isSaved) {
                    Text(
                        text = "✓ Settings saved. Restart app to apply changes.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF4CAF50)
                    )
                }

                uiState.error?.let {
                    Text(
                        text = "⚠ $it",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Red
                    )
                }
            }
        }
    }
}
