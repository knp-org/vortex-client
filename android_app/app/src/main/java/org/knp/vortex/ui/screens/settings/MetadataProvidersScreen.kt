package org.knp.vortex.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.ErrorRed
import org.knp.vortex.ui.theme.GrayText

@Composable
fun MetadataProvidersScreen(
    onBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showResetDialog by remember { mutableStateOf(false) }

    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                GlassyTopBar(title = "Metadata Providers", onBack = onBack)
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


                if (showResetDialog) {
                    org.knp.vortex.ui.components.GlassyDialog(
                        onDismissRequest = { showResetDialog = false },
                        title = "Reset Database?",
                        content = {
                            Text(
                                "This will clear all metadata and scanned libraries. This action cannot be undone.",
                                color = Color.White.copy(alpha = 0.8f),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        },
                        confirmButton = {
                            Button(
                                onClick = { 
                                    viewModel.resetDatabase() 
                                    showResetDialog = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)
                            ) {
                                Text("Reset", color = Color.White)
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showResetDialog = false }) {
                                Text("Cancel", color = Color.Gray)
                            }
                        }
                    )
                }

                org.knp.vortex.ui.components.GlassyCard(
                    onClick = { showResetDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.Red.copy(alpha = 0.1f)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = Color.Red.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = Color.Red,
                                modifier = Modifier.padding(12.dp).size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text("Reset Database", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                            Text("Clear all metadata and libraries completely", color = GrayText, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Providers",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                uiState.providers.forEachIndexed { index, provider ->
                    org.knp.vortex.ui.components.GlassyCard(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = provider.name,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.bodyLarge
                                )
                                Text(
                                    text = provider.description,
                                    color = GrayText,
                                    style = MaterialTheme.typography.bodySmall,
                                    maxLines = 2
                                )
                            }
                            
                            Spacer(modifier = Modifier.width(16.dp))

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                IconButton(
                                    onClick = { viewModel.moveProviderUp(provider.id) },
                                    enabled = index > 0,
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.KeyboardArrowUp,
                                        contentDescription = "Move Up",
                                        tint = if (index > 0) Color.White else Color.Gray
                                    )
                                }
                                IconButton(
                                    onClick = { viewModel.moveProviderDown(provider.id) },
                                    enabled = index < uiState.providers.size - 1,
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.KeyboardArrowDown,
                                        contentDescription = "Move Down",
                                        tint = if (index < uiState.providers.size - 1) Color.White else Color.Gray
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.width(16.dp))

                            Switch(
                                checked = provider.enabled,
                                onCheckedChange = { viewModel.toggleProvider(provider.id, it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = org.knp.vortex.ui.theme.PrimaryBlue,
                                    uncheckedThumbColor = Color.Gray,
                                    uncheckedTrackColor = Color.DarkGray
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}
