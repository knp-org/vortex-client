package org.knp.vortex.ui.screens.settings

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.GrayText

@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onNavigateToServerConfig: () -> Unit,
    onNavigateToLibrarySettings: () -> Unit,
    onNavigateToMetadataProviders: () -> Unit,
    onNavigateToSecurity: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val displayName = if (!uiState.username.isNullOrEmpty()) uiState.username else "Alex Mercer"
    val displayRole = if (!uiState.username.isNullOrEmpty()) "User Account" else "Administrator Account"

    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(start = 24.dp, end = 24.dp, bottom = 120.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(24.dp))

                // Profile Avatar Section matching the mockup exactly
                Box(
                    modifier = Modifier
                        .size(105.dp),
                    contentAlignment = Alignment.BottomEnd
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(Color(0xFF13101B).copy(alpha = 0.6f))
                            .border(
                                2.dp,
                                Brush.linearGradient(
                                    colors = listOf(
                                        Color.White.copy(alpha = 0.3f), // Monochrome silver highlight
                                        Color.White.copy(alpha = 0.05f)
                                    )
                                ),
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Profile Picture",
                            tint = Color.White.copy(alpha = 0.8f),
                            modifier = Modifier.size(54.dp)
                        )
                    }

                    // Edit icon badge on the bottom-right of the avatar circle
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF2E2E2E))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                            .clickable { /* Edit profile avatar action */ },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Edit Profile",
                            tint = Color.White.copy(alpha = 0.8f),
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // User details
                Text(
                    text = displayName!!,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = displayRole,
                    color = GrayText.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.bodyMedium
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Grouped Card List with small line separators
                org.knp.vortex.ui.components.GlassyCard(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        SettingsListRow(
                            title = "Server Configuration",
                            subtitle = "Network settings, ports, and access control",
                            icon = Icons.Default.Dns,
                            onClick = onNavigateToServerConfig
                        )
                        HorizontalDivider(color = Color.White.copy(alpha = 0.1f), thickness = 1.dp)
                        SettingsListRow(
                            title = "Library Management",
                            subtitle = "Folders, scanning, and media types",
                            icon = Icons.Default.Folder,
                            onClick = onNavigateToLibrarySettings
                        )
                        HorizontalDivider(color = Color.White.copy(alpha = 0.1f), thickness = 1.dp)
                        SettingsListRow(
                            title = "Metadata Providers",
                            subtitle = "Scrapers, language, and artwork",
                            icon = Icons.Default.Storage,
                            onClick = onNavigateToMetadataProviders
                        )
                        HorizontalDivider(color = Color.White.copy(alpha = 0.1f), thickness = 1.dp)
                        SettingsListRow(
                            title = "Security",
                            subtitle = "Passwords, 2FA, and sessions",
                            icon = Icons.Default.Security,
                            onClick = onNavigateToSecurity
                        )
                    }
                }

                Spacer(modifier = Modifier.height(36.dp))

                // Premium Outlined Sign Out button matching mockup dusty rose tint
                // Premium Outlined Sign Out button using the 'error' color from DESIGN.md
                val signOutTint = Color(0xFFFFB4AB)
                OutlinedButton(
                    onClick = { viewModel.logout() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 32.dp),
                    border = BorderStroke(
                        1.dp,
                        signOutTint.copy(alpha = 0.3f) // Pronounced rim lighting
                    ),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = signOutTint.copy(alpha = 0.05f), // 5% fill
                        contentColor = signOutTint
                    ),
                    shape = RoundedCornerShape(24.dp), // rounded-xl (1.5rem)
                    contentPadding = PaddingValues(vertical = 14.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Logout,
                            contentDescription = "Sign Out",
                            tint = signOutTint,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            "SIGN OUT",
                            color = signOutTint,
                            fontWeight = FontWeight.SemiBold,
                            style = MaterialTheme.typography.labelLarge,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsListRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: (() -> Unit)? = null
) {
    val rowModifier = if (onClick != null) {
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 12.dp)
    } else {
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)
    }

    Row(
        modifier = rowModifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Glowing circular icon container with gradient background
        Box(
            modifier = Modifier
                .size(32.dp) // Smaller container
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
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.8f), // Monochrome white tint
                modifier = Modifier.size(16.dp) // Smaller icon
            )
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = Color.White.copy(alpha = 0.95f),
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.bodyMedium // Smaller title
            )
            Text(
                text = subtitle,
                color = GrayText.copy(alpha = 0.7f),
                style = MaterialTheme.typography.labelSmall // Smaller subtitle
            )
        }
        Icon(
            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = "Navigate",
            tint = Color.White.copy(alpha = 0.4f),
            modifier = Modifier.size(16.dp) // Smaller arrow
        )
    }
}
