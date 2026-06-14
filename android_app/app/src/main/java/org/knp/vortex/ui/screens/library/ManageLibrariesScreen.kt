package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Refresh
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
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.GlassyCard
import org.knp.vortex.ui.components.GlassySurface
import org.knp.vortex.ui.components.GlassyDialog

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManageLibrariesScreen(
    onBack: () -> Unit,
    onAddLibrary: () -> Unit,
    onEditLibrary: (Long) -> Unit,
    onOpenLibrary: (Long, String) -> Unit,
    viewModel: ManageLibrariesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var libraryToDeleteId by remember { mutableStateOf<Long?>(null) }
    var libraryToDeleteName by remember { mutableStateOf<String?>(null) }

    GlassyBackground {
        Scaffold(
            containerColor = Color.Transparent, // Transparent for GlassyBackground
            topBar = {
                GlassyTopBar(title = "Manage Libraries", onBack = onBack)
            },
            floatingActionButton = {
                ExtendedFloatingActionButton(
                    onClick = onAddLibrary,
                    containerColor = Color.White,
                    contentColor = Color.Black,
                    icon = { Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    text = { Text("ADD LIBRARY", fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp, style = MaterialTheme.typography.labelSmall) },
                    shape = RoundedCornerShape(24.dp)
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Scan Section
                GlassySurface(
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Scan Libraries",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Check folders for new media",
                                style = MaterialTheme.typography.bodySmall,
                                color = GrayText
                            )
                        }
                        
                        OutlinedButton(
                            onClick = { viewModel.scanLibraries() },
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = Color.White.copy(alpha = 0.05f),
                                contentColor = Color.White
                            ),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                            enabled = !uiState.isScanning,
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            shape = RoundedCornerShape(24.dp)
                        ) {
                            if (uiState.isScanning) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Scanning")
                            } else {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Fast Scan")
                            }
                        }
                    }
                }

                // Libraries List Section
                Text(
                    text = "Your Libraries",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 8.dp)
                )

                if (uiState.isLoading) {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color.White)
                    }
                } else if (uiState.libraries.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        Text("No libraries found", color = GrayText)
                    }
                } else {
                    uiState.libraries.forEach { lib ->
                        LibraryItem(
                            name = lib.name,
                            path = lib.paths.joinToString(", "),
                            type = lib.library_type,
                            onClick = { onOpenLibrary(lib.id, lib.name) },
                            onEdit = { onEditLibrary(lib.id) },
                            onDelete = {
                                libraryToDeleteId = lib.id
                                libraryToDeleteName = lib.name
                            }
                        )
                    }
                }

                uiState.error?.let {
                    Text(
                        text = "Error: $it",
                        color = Color.Red,
                        modifier = Modifier.padding(8.dp)
                    )
                }
                
                Spacer(modifier = Modifier.height(80.dp)) // Floating action button spacer
            }
        }

        libraryToDeleteId?.let { id ->
            GlassyDialog(
                onDismissRequest = { 
                    libraryToDeleteId = null
                    libraryToDeleteName = null 
                },
                title = "Delete Library",
                content = {
                    Text(
                        text = "Are you sure you want to delete '${libraryToDeleteName}'? This action cannot be undone.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = GrayText
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.deleteLibrary(id)
                            libraryToDeleteId = null
                            libraryToDeleteName = null
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFFFB4AB),
                            contentColor = Color.Black
                        ),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Text("Delete", fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    OutlinedButton(
                        onClick = {
                            libraryToDeleteId = null
                            libraryToDeleteName = null
                        },
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = Color.White
                        ),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun LibraryItem(
    name: String,
    path: String,
    type: String,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    GlassyCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 24.dp, vertical = 20.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = path,
                    style = MaterialTheme.typography.bodySmall,
                    color = GrayText,
                    maxLines = 1
                )
            }
            
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                val errorColor = Color(0xFFFFB4AB)
                IconButton(
                    onClick = onEdit,
                    colors = IconButtonDefaults.iconButtonColors(contentColor = Color.White.copy(alpha = 0.7f)),
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(20.dp))
                }
                IconButton(
                    onClick = onDelete,
                    colors = IconButtonDefaults.iconButtonColors(contentColor = errorColor),
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}
