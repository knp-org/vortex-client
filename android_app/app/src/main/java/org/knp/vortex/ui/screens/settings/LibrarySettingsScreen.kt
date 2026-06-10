package org.knp.vortex.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.GrayText
import org.knp.vortex.ui.theme.PrimaryBlue

@Composable
fun LibrarySettingsScreen(
    onBack: () -> Unit,
    onManageLibraries: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                GlassyTopBar(title = "Library Management", onBack = onBack)
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
                org.knp.vortex.ui.components.GlassyCard(
                    onClick = onManageLibraries,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Glowing circular icon container
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(androidx.compose.foundation.shape.CircleShape)
                                .background(
                                    androidx.compose.ui.graphics.Brush.linearGradient(
                                        colors = listOf(
                                            Color.White.copy(alpha = 0.15f),
                                            Color.White.copy(alpha = 0.02f)
                                        )
                                    )
                                )
                                .border(
                                    1.dp,
                                    androidx.compose.ui.graphics.Brush.linearGradient(
                                        colors = listOf(
                                            Color.White.copy(alpha = 0.35f),
                                            Color.White.copy(alpha = 0.05f)
                                        )
                                    ),
                                    androidx.compose.foundation.shape.CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Folder,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.8f),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text("Manage Libraries", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                            Text("Add or remove media folders", color = GrayText, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
                
                org.knp.vortex.ui.components.GlassyCard(
                    onClick = { viewModel.scanLibraries() },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Glowing circular icon container
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(androidx.compose.foundation.shape.CircleShape)
                                .background(
                                    androidx.compose.ui.graphics.Brush.linearGradient(
                                        colors = listOf(
                                            Color.White.copy(alpha = 0.15f),
                                            Color.White.copy(alpha = 0.02f)
                                        )
                                    )
                                )
                                .border(
                                    1.dp,
                                    androidx.compose.ui.graphics.Brush.linearGradient(
                                        colors = listOf(
                                            Color.White.copy(alpha = 0.35f),
                                            Color.White.copy(alpha = 0.05f)
                                        )
                                    ),
                                    androidx.compose.foundation.shape.CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Sync,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.8f),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text("Scan All Libraries", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                            Text("Discover new media files across all libraries", color = GrayText, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }
    }
}
