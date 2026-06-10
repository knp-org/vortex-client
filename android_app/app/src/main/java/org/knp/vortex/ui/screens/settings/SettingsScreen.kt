package org.knp.vortex.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.GrayText
import org.knp.vortex.ui.theme.PrimaryBlue

import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onNavigateToServerConfig: () -> Unit,
    onNavigateToLibrarySettings: () -> Unit,
    onNavigateToMetadataProviders: () -> Unit,
    onNavigateToSecurity: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                GlassyTopBar(title = "Settings", onBack = onBack)
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
                SettingsCategoryItem(
                    title = "Server Configuration",
                    subtitle = "Manage server URL and connection",
                    icon = Icons.Default.Dns,
                    onClick = onNavigateToServerConfig
                )

                SettingsCategoryItem(
                    title = "Library Management",
                    subtitle = "Scan and configure media folders",
                    icon = Icons.Default.Folder,
                    onClick = onNavigateToLibrarySettings
                )

                SettingsCategoryItem(
                    title = "Metadata Providers",
                    subtitle = "Configure TMDB and reset database",
                    icon = Icons.Default.Storage,
                    onClick = onNavigateToMetadataProviders
                )

                SettingsCategoryItem(
                    title = "Security",
                    subtitle = "App lock and biometric authentication",
                    icon = Icons.Default.Security,
                    onClick = onNavigateToSecurity
                )

                Spacer(modifier = Modifier.weight(1f))

                Button(
                    onClick = { viewModel.logout() },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = org.knp.vortex.ui.theme.ErrorRed),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Sign Out", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun SettingsCategoryItem(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    org.knp.vortex.ui.components.GlassyCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = PrimaryBlue.copy(alpha = 0.2f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = PrimaryBlue,
                    modifier = Modifier.padding(12.dp).size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title, 
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
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = "Navigate",
                tint = Color.Gray,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}
