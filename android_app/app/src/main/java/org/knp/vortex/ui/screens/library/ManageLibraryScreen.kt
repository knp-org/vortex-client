package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FindInPage
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.GlassyCard
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.GrayText

@Composable
fun ManageLibraryScreen(
    libraryId: Long,
    libraryName: String,
    onBack: () -> Unit,
    viewModel: ManageLibraryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                GlassyTopBar(title = libraryName, onBack = onBack)
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
                LibraryActionCard(
                    icon = Icons.Default.FindInPage,
                    title = "Scan Files",
                    subtitle = "Find new media in this library and fetch metadata that hasn't been fetched before",
                    busy = uiState.isScanning,
                    busyLabel = "Scanning…",
                    enabled = !uiState.isScanning && !uiState.isRefreshing,
                    onClick = { viewModel.scan(libraryId) }
                )

                LibraryActionCard(
                    icon = Icons.Default.Sync,
                    title = "Refresh Metadata",
                    subtitle = "Re-fetch metadata for every item in this library",
                    busy = uiState.isRefreshing,
                    busyLabel = "Refreshing…",
                    enabled = !uiState.isScanning && !uiState.isRefreshing,
                    onClick = { viewModel.refresh(libraryId) }
                )

                uiState.message?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier.padding(horizontal = 4.dp)
                    )
                }

                uiState.error?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFFFB4AB),
                        modifier = Modifier.padding(horizontal = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun LibraryActionCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    busy: Boolean,
    busyLabel: String,
    enabled: Boolean,
    onClick: () -> Unit
) {
    GlassyCard(
        onClick = if (enabled) onClick else null,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.15f),
                                Color.White.copy(alpha = 0.02f)
                            )
                        )
                    )
                    .border(
                        1.dp,
                        Brush.linearGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.35f),
                                Color.White.copy(alpha = 0.05f)
                            )
                        ),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (busy) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (busy) busyLabel else title,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = subtitle,
                    color = GrayText,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
