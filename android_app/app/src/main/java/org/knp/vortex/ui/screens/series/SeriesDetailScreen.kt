package org.knp.vortex.ui.screens.series

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import org.knp.vortex.data.remote.EpisodeDto
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.screens.movie.CastList
import org.knp.vortex.ui.theme.*
import androidx.compose.ui.graphics.asImageBitmap
import kotlinx.coroutines.launch

@Composable
fun SeriesDetailScreen(
    onBack: () -> Unit,
    onIdentify: (String) -> Unit,
    onPlayEpisode: (Long, String) -> Unit,
    viewModel: SeriesDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showMenu by remember { mutableStateOf(false) }

    org.knp.vortex.ui.components.GlassyBackground {
        Scaffold(containerColor = Color.Transparent) { _ ->
            Box(modifier = Modifier.fillMaxSize()) {
                if (uiState.isLoading && uiState.seriesDetail == null) {
                    CircularProgressIndicator(
                        color = Color.White,
                        modifier = Modifier.align(Alignment.Center)
                    )
                } else if (uiState.seriesDetail != null) {
                    val detail = uiState.seriesDetail!!
                    
                    LazyColumn(
                        contentPadding = PaddingValues(bottom = 32.dp)
                    ) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().height(450.dp)) {
                                AsyncImage(
                                    model = org.knp.vortex.utils.formatImageUrl(detail.backdrop_url, uiState.serverUrl) ?: org.knp.vortex.utils.formatImageUrl(detail.poster_url, uiState.serverUrl),
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
                                    Card(
                                        shape = RoundedCornerShape(16.dp),
                                        elevation = CardDefaults.cardElevation(24.dp),
                                        modifier = Modifier
                                            .width(140.dp)
                                            .aspectRatio(0.67f)
                                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                                    ) {
                                        AsyncImage(
                                            model = org.knp.vortex.utils.formatImageUrl(detail.poster_url, uiState.serverUrl),
                                            contentDescription = detail.name,
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Crop
                                        )
                                    }
                                    
                                    Spacer(modifier = Modifier.width(20.dp))
                                    
                                    Column(modifier = Modifier.padding(bottom = 8.dp).weight(1f)) {
                                        Text(
                                            text = detail.name,
                                            style = MaterialTheme.typography.headlineMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            if (detail.year != null && detail.year > 0) {
                                                Text(
                                                    text = "${detail.year}",
                                                    style = MaterialTheme.typography.titleMedium,
                                                    color = GrayText
                                                )
                                            }
                                            if (!detail.age_rating.isNullOrBlank()) {
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Surface(
                                                    color = Color.Transparent,
                                                    shape = RoundedCornerShape(4.dp),
                                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                                                ) {
                                                    Text(detail.age_rating, color = Color.White, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                                }
                                            }
                                        }
                                        
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Button(
                                            onClick = { /* TODO */ },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                                            shape = RoundedCornerShape(24.dp),
                                            contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp)
                                        ) {
                                            Icon(Icons.Filled.PlayArrow, contentDescription = null, modifier = Modifier.size(20.dp))
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("Play", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }

                        item {
                            Column(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                                verticalArrangement = Arrangement.spacedBy(32.dp)
                            ) {
                                // Details Grid
                                Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                                    Row {
                                        Text("Genres", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                        Text(detail.genres ?: "N/A", color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row {
                                        Text("Director", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                        Text(detail.director ?: "Unknown", color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    }
                                    if (!detail.studio.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row {
                                            Text("Studio", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                            Text(detail.studio, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                    if (!detail.origin_country.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row {
                                            Text("Country", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                            Text(detail.origin_country, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                    if (!detail.collection_name.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row {
                                            Text("Collection", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                            Text(detail.collection_name, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                    if (!detail.creator.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row {
                                            Text("Creator", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                            Text(detail.creator, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                    if (!detail.tags.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row {
                                            Text("Tags", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                            Text(detail.tags, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                }
                                
                                if (!detail.plot.isNullOrEmpty()) {
                                    Text(
                                        text = detail.plot,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = GrayText,
                                        lineHeight = 24.sp,
                                        modifier = Modifier.padding(horizontal = 24.dp)
                                    )
                                }
                                
                                CastList(detail.cast, uiState.serverUrl)
                            }
                        }

                        item {
                            Text(
                                text = "Seasons",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 24.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 24.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(detail.seasons) { season ->
                                    FilterChip(
                                        selected = season.season_number == uiState.selectedSeason,
                                        onClick = { viewModel.selectSeason(season.season_number) },
                                        label = { Text("Season ${season.season_number}") },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = Color.White,
                                            selectedLabelColor = Color.Black,
                                            containerColor = Color.White.copy(alpha = 0.05f),
                                            labelColor = GrayText
                                        ),
                                        border = null
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(24.dp))
                        }

                        item {
                            if (uiState.episodes.isNotEmpty()) {
                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                                    contentPadding = PaddingValues(horizontal = 24.dp)
                                ) {
                                    items(uiState.episodes) { episode ->
                                        SleekEpisodeItem(episode, uiState.serverUrl, onClick = { onPlayEpisode(episode.id, episode.file_path) })
                                    }
                                }
                            } else {
                                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                    if (uiState.isLoading) {
                                        CircularProgressIndicator(color = Color.White)
                                    } else {
                                        Text("No episodes found", color = GrayText)
                                    }
                                }
                            }
                        }
                    }
                }
                
                org.knp.vortex.ui.components.GlassyTopBar(
                    title = "",
                    onBack = onBack,
                    containerColor = Color.Transparent,
                    actions = {
                        Box {
                            IconButton(onClick = { showMenu = true }) {
                                Icon(
                                    imageVector = Icons.Default.MoreVert,
                                    contentDescription = "More",
                                    tint = Color.White
                                )
                            }
                            DropdownMenu(
                                expanded = showMenu,
                                onDismissRequest = { showMenu = false },
                                modifier = Modifier.background(SurfaceColor)
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Refresh Metadata", color = Color.White) },
                                    onClick = {
                                        viewModel.refreshMetadata()
                                        showMenu = false
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Identify", color = Color.White) },
                                    onClick = {
                                        onIdentify(viewModel.seriesName)
                                        showMenu = false
                                    }
                                )
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun SleekEpisodeItem(episode: EpisodeDto, serverUrl: String, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(280.dp)
            .clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f/9f)
                .clip(RoundedCornerShape(12.dp))
                .background(SurfaceColor)
        ) {
            val context = androidx.compose.ui.platform.LocalContext.current
            val request = androidx.compose.runtime.remember(episode.poster_url, serverUrl) {
                coil.request.ImageRequest.Builder(context)
                    .data(org.knp.vortex.utils.formatImageUrl(episode.poster_url, serverUrl) ?: "${serverUrl.trimEnd('/')}/api/v1/media/${episode.id}/thumbnail")
                    .crossfade(true)
                    .allowHardware(false)
                    .size(512)
                    .build()
            }
            var isError by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }

            if (!isError) {
                AsyncImage(
                    model = request,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                    onError = { isError = true }
                )
            } else {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.PlayArrow, contentDescription = null, tint = Color.White.copy(alpha = 0.5f))
                }
            }
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    color = Color.White.copy(alpha = 0.2f),
                    shape = CircleShape,
                    modifier = Modifier.size(40.dp)
                ) {
                    Icon(Icons.Filled.PlayArrow, contentDescription = null, tint = Color.White, modifier = Modifier.padding(8.dp).align(Alignment.Center))
                }
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Text(
            text = "${episode.episode_number}. ${episode.title ?: "Episode ${episode.episode_number}"}",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = episode.plot ?: "No description available.",
            style = MaterialTheme.typography.bodySmall,
            color = GrayText,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            lineHeight = 16.sp
        )
    }
}

@Composable
fun MetadataChip(text: String, backgroundColor: Color = SurfaceColor.copy(alpha = 0.8f)) {
    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(6.dp)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            color = Color.White,
            style = MaterialTheme.typography.labelMedium
        )
    }
}
