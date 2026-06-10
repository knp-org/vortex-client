package org.knp.vortex.ui.screens.library

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import org.knp.vortex.data.remote.DirectoryEntryDto
import org.knp.vortex.ui.components.GlassyDialog
import org.knp.vortex.ui.theme.GrayText

@Composable
fun DirectoryPickerDialog(
    currentPath: String,
    directories: List<DirectoryEntryDto>,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSelectPath: (String) -> Unit, // Confirm this path
    onNavigate: (String) -> Unit // Enter directory
) {
    GlassyDialog(
        onDismissRequest = onDismiss,
        title = "Select Server Folder",
        content = {
            Column(modifier = Modifier.fillMaxWidth().heightIn(min = 200.dp, max = 400.dp)) {
                // Current Path and Up Button
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { onNavigate("..") }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Up", tint = GrayText)
                    }
                    Text(
                        text = if (currentPath.isEmpty()) "Root" else currentPath,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier.weight(1f)
                    )
                }
                
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f), thickness = 1.dp)
                
                // Directory List
                Box(modifier = Modifier.weight(1f)) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.align(Alignment.Center))
                    } else {
                        LazyColumn {
                            items(directories) { dir ->
                                DirectoryItem(dir, onClick = { onNavigate(dir.path) })
                            }
                            if (directories.isEmpty()) {
                                item {
                                    Text("No folders found", color = GrayText, modifier = Modifier.padding(16.dp))
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onSelectPath(currentPath) },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                shape = RoundedCornerShape(24.dp)
            ) {
                Text("Select Current", fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onDismiss,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                shape = RoundedCornerShape(24.dp)
            ) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun DirectoryItem(entry: DirectoryEntryDto, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Default.Folder, contentDescription = null, tint = Color.White.copy(alpha = 0.7f))
        Spacer(modifier = Modifier.width(16.dp))
        Text(text = entry.name, color = Color.White)
    }
}
