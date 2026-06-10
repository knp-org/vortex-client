package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateLibraryScreen(
    onBack: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: CreateLibraryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            onSuccess()
            viewModel.resetState()
        }
    }
    
    if (uiState.showDirectoryPicker) {
        DirectoryPickerDialog(
            currentPath = uiState.directoryPath,
            directories = uiState.availableDirectories,
            isLoading = uiState.isDirectoryLoading,
            onDismiss = { viewModel.closeDirectoryPicker() },
            onSelectPath = { viewModel.selectDirectory(it) },
            onNavigate = { viewModel.navigateDirectory(it) }
        )
    }

    org.knp.vortex.ui.components.GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                val title = if (viewModel.libraryId != -1L) "Edit Library" else "Create Library"
                GlassyTopBar(title = title, onBack = onBack)
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(bottom = 16.dp) // Bottom padding only
                    .verticalScroll(rememberScrollState()), // Add scroll support
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Name Input
                    org.knp.vortex.ui.components.GlassyTextField(
                        value = uiState.name,
                        onValueChange = { viewModel.updateName(it) },
                        label = "Library Name",
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Path Selection
                    Text("Folder Paths", color = Color.White, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        uiState.paths.forEach { path ->
                            org.knp.vortex.ui.components.GlassyCard(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = path, color = Color.White, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                                    IconButton(onClick = { viewModel.removePath(path) }, modifier = Modifier.size(32.dp)) {
                                        Icon(Icons.Default.Close, contentDescription = "Remove Path", tint = Color(0xFFFFB4AB), modifier = Modifier.size(20.dp))
                                    }
                                }
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            org.knp.vortex.ui.components.GlassyTextField(
                                value = uiState.currentPathInput,
                                onValueChange = { viewModel.updateCurrentPathInput(it) },
                                label = "Server Path",
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                trailingIcon = {
                                    IconButton(onClick = { viewModel.openDirectoryPicker() }) {
                                        Icon(Icons.Default.Folder, contentDescription = "Browse", tint = Color.White)
                                    }
                                }
                            )
                            IconButton(
                                onClick = { viewModel.addPath(uiState.currentPathInput) },
                                modifier = Modifier
                                    .size(56.dp) // Match height of GlassyTextField roughly
                                    .background(Color.White.copy(alpha = 0.15f), shape = RoundedCornerShape(12.dp))
                                    .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Add Path", tint = Color.White)
                            }
                        }
                    }
                    Text("Click folder icon to browse server paths, or + to add manual path", color = GrayText, style = MaterialTheme.typography.bodySmall)

                    // Type Dropdown
                    Text("Library Type", color = Color.White, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("movies", "tv_shows", "music_videos", "other").forEach { type ->
                            val isSelected = uiState.type == type
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.updateType(type) },
                                label = { Text(type.replace("_", " ").capitalize(), style = MaterialTheme.typography.labelSmall) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color.White,
                                    containerColor = Color.White.copy(alpha = 0.05f),
                                    labelColor = Color.White.copy(alpha = 0.7f),
                                    selectedLabelColor = Color.Black
                                ),
                                border = null,
                                shape = RoundedCornerShape(24.dp)
                            )
                        }
                    }

                    if (uiState.error != null) {
                        Text(
                            text = uiState.error!!,
                            color = Color.Red,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { viewModel.createLibrary() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = Color.Black
                        ),
                        shape = RoundedCornerShape(24.dp),
                        enabled = !uiState.isLoading
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(24.dp))
                        } else {
                            val btnText = if (viewModel.libraryId != -1L) "Save Changes" else "Done"
                            Text(btnText, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }
                }
            }
        }
    }
}

private fun String.capitalize(): String {
    return this.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
}
