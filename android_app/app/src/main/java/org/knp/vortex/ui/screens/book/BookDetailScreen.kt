package org.knp.vortex.ui.screens.book

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import org.knp.vortex.ui.theme.DeepBackground
import org.knp.vortex.ui.theme.SurfaceColor
import org.knp.vortex.ui.theme.GrayText

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun BookDetailScreen(
    mediaId: Long,
    onRead: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: BookDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    var showMenu by remember { mutableStateOf(false) }

    LaunchedEffect(mediaId) {
        viewModel.loadMedia(mediaId)
    }

    org.knp.vortex.ui.components.GlassyBackground {
        Scaffold(containerColor = Color.Transparent) { _ ->
            Box(modifier = Modifier.fillMaxSize()) {
                if (uiState.isLoading && uiState.media == null) {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = Color.White
                    )
                } else if (uiState.media != null) {
                    val media = uiState.media!!
                    
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                    ) {
                        // Header Section
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(450.dp)
                        ) {
                            // Backdrop
                            AsyncImage(
                                model = media.poster_url?.let { url ->
                                    if (url.startsWith("/")) "${uiState.serverUrl.trimEnd('/')}$url" else url
                                },
                                contentDescription = "Background",
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(SurfaceColor),
                                contentScale = ContentScale.Crop
                            )
                            
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(Color.Transparent, DeepBackground),
                                            startY = 0f, 
                                            endY = 1300f
                                        )
                                    )
                            )
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .fillMaxWidth()
                                    .height(150.dp)
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(Color.Transparent, DeepBackground),
                                        )
                                    )
                            )

                            Row(
                                modifier = Modifier
                                    .align(Alignment.BottomStart)
                                    .padding(horizontal = 24.dp, vertical = 24.dp),
                                verticalAlignment = Alignment.Bottom
                            ) {
                                // Poster Card
                                Card(
                                    shape = RoundedCornerShape(16.dp),
                                    elevation = CardDefaults.cardElevation(24.dp),
                                    modifier = Modifier
                                        .width(140.dp)
                                        .aspectRatio(0.67f)
                                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                                ) {
                                    AsyncImage(
                                        model = media.poster_url?.let { url ->
                                            if (url.startsWith("/")) "${uiState.serverUrl.trimEnd('/')}$url" else url
                                        },
                                        contentDescription = media.title,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                }
                                
                                Spacer(modifier = Modifier.width(20.dp))
                                
                                Column(modifier = Modifier.padding(bottom = 8.dp).weight(1f)) {
                                    Text(
                                        text = media.title ?: "Unknown Title",
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    
                                    Spacer(modifier = Modifier.height(12.dp))
                                    
                                    Button(
                                        onClick = { onRead(mediaId) },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                                        shape = RoundedCornerShape(24.dp),
                                        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp)
                                    ) {
                                        Icon(Icons.Filled.Book, contentDescription = null, modifier = Modifier.size(20.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Read Now", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }

                        // Content (Info)
                        Column(
                             modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 24.dp)
                        ) {
                            if (!media.plot.isNullOrEmpty()) {
                                Text(
                                    text = "Description",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = media.plot,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = GrayText,
                                    lineHeight = 24.sp
                                )
                                Spacer(modifier = Modifier.height(24.dp))
                            }
                            
                            // File Info
                            org.knp.vortex.ui.components.GlassyCard(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = "File Information",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = media.file_path.substringAfterLast("/").substringAfterLast("\\"),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = GrayText,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(32.dp))
                        }
                    }
                    
                    // Top Bar
                    org.knp.vortex.ui.components.GlassyTopBar(
                        title = "",
                        onBack = onBack,
                        containerColor = Color.Transparent,
                        actions = {
                            Box {
                                IconButton(onClick = { showMenu = true }) {
                                    Icon(Icons.Default.MoreVert, contentDescription = "More", tint = Color.White)
                                }
                                DropdownMenu(
                                    expanded = showMenu,
                                    onDismissRequest = { showMenu = false },
                                    modifier = Modifier.background(SurfaceColor)
                                ) {
                                    DropdownMenuItem(
                                        text = { Text("Refresh Metadata", color = Color.White) },
                                        onClick = {
                                            viewModel.refreshMetadata(mediaId)
                                            showMenu = false
                                        }
                                    )
                                }
                            }
                        }
                    )
                } else if (uiState.error != null) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = "Error: ${uiState.error}", color = Color.Red)
                    }
                }
            }
        }
    }
}
