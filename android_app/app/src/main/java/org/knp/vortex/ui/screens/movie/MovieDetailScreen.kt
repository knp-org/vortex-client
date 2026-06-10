package org.knp.vortex.ui.screens.movie

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
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
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.DeepBackground
import org.knp.vortex.ui.theme.PrimaryBlue
import org.knp.vortex.ui.theme.SurfaceColor
import org.knp.vortex.ui.theme.GrayText

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MovieDetailScreen(
    mediaId: Long,
    onPlay: (Long) -> Unit,
    onBack: () -> Unit,
    onIdentify: (Long, String?, String?) -> Unit = { _, _, _ -> },
    viewModel: MovieDetailViewModel = hiltViewModel()
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
                if (uiState.isLoading) {
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
                        // Header Section (Backdrop + Poster Overlay)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(450.dp)
                        ) {
                            // Backdrop
                            AsyncImage(
                                model = org.knp.vortex.utils.formatImageUrl(media.backdrop_url, uiState.serverUrl) ?: org.knp.vortex.utils.formatImageUrl(media.poster_url, uiState.serverUrl),
                                contentDescription = "Background",
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(SurfaceColor),
                                contentScale = ContentScale.Crop
                            )
                            
                            // Gradient Overlay (Bottom Up)
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
                            
                            // Solid fade at bottom to merge
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

                            // Content (Poster + Info)
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
                                        model = org.knp.vortex.utils.formatImageUrl(media.poster_url, uiState.serverUrl),
                                        contentDescription = media.title,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                }
                                
                                Spacer(modifier = Modifier.width(20.dp))
                                
                                Column(
                                    modifier = Modifier
                                        .padding(bottom = 8.dp)
                                        .weight(1f)
                                ) {
                                    Text(
                                        text = media.title ?: "Unknown",
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    
                                    Spacer(modifier = Modifier.height(4.dp))
                                    
                                    // Metadata Row
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        if (media.year != null && media.year > 0) {
                                            Text(
                                                text = "${media.year}",
                                                style = MaterialTheme.typography.titleMedium,
                                                color = GrayText
                                            )
                                        }
                                        if (media.runtime != null && media.runtime > 0) {
                                            Text(
                                                text = "${media.runtime / 60}h ${media.runtime % 60}m",
                                                style = MaterialTheme.typography.titleMedium,
                                                color = GrayText
                                            )
                                        }
                                        if (!media.age_rating.isNullOrBlank()) {
                                            Surface(
                                                color = Color.Transparent,
                                                shape = RoundedCornerShape(4.dp),
                                                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                                            ) {
                                                Text(media.age_rating, color = Color.White, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                            }
                                        }
                                        Surface(
                                            color = Color.Transparent,
                                            shape = RoundedCornerShape(4.dp),
                                            border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                                        ) {
                                            Text("HD", color = Color.White, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                        }
                                    }

                                    if (!media.genres.isNullOrEmpty()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        // Fix: FlowRow for wrapping genres
                                        @OptIn(ExperimentalLayoutApi::class)
                                        FlowRow(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            media.genres.split(", ").take(3).forEach { genre ->
                                                MetadataChip(text = genre, backgroundColor = Color.White.copy(alpha = 0.15f))
                                            }
                                        }
                                    }
                                    
                                    Spacer(modifier = Modifier.height(12.dp))
                                    
                                    // Play Button
                                    Button(
                                        onClick = { onPlay(mediaId) },
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

                        // Description and Other Details
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 24.dp),
                            verticalArrangement = Arrangement.spacedBy(32.dp)
                        ) {
                            // Details Grid
                            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                                Row {
                                    Text("Genres", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                    Text(media.genres ?: "N/A", color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Row {
                                    Text("Director", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                    Text(media.director ?: "Unknown", color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                }
                                if (!media.studio.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row {
                                        Text("Studio", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                        Text(media.studio, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                                if (!media.origin_country.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row {
                                        Text("Country", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                        Text(media.origin_country, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                                if (!media.collection_name.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row {
                                        Text("Collection", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                        Text(media.collection_name, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                                if (!media.creator.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row {
                                        Text("Creator", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                        Text(media.creator, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                                if (!media.tags.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row {
                                        Text("Tags", color = GrayText, modifier = Modifier.width(80.dp), style = MaterialTheme.typography.bodyMedium)
                                        Text(media.tags, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                            }
                            
                            // Synopsis
                            if (!media.plot.isNullOrEmpty()) {
                                Text(
                                    text = media.plot,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = GrayText,
                                    lineHeight = 24.sp,
                                    modifier = Modifier.padding(horizontal = 24.dp)
                                )
                            }
                            
                            CastList(media.cast, uiState.serverUrl)
                            
                            // File Info Card (Glassy)
                            org.knp.vortex.ui.components.GlassyCard(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(20.dp),
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
                            
                            // Bottom spacer for safe area
                            Spacer(modifier = Modifier.height(32.dp))
                        }
                    }
                    
                    // Top Bar Overlay
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
                                        text = { Text("Refresh Metadata", color = Color.White) }, // Fixed Text Color
                                        onClick = {
                                            viewModel.refreshMetadata(mediaId)
                                            showMenu = false
                                        }
                                    )
                                    DropdownMenuItem(
                                        text = { Text("Identify", color = Color.White) }, // Fixed Text Color
                                        onClick = {
                                            showMenu = false
                                            onIdentify(mediaId, uiState.media?.title, uiState.media?.media_type)
                                        }
                                    )
                                }
                            }
                        }
                    )
                } else if (uiState.error != null) {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Error loading media",
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = uiState.error ?: "Unknown error",
                            color = GrayText
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MetadataChip(text: String, backgroundColor: Color = SurfaceColor.copy(alpha = 0.8f)) {
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

data class CastMember(
    val name: String,
    val character: String,
    val profile_url: String?
)

@Composable
fun CastList(castJson: String?, serverUrl: String) {
    if (castJson.isNullOrBlank()) return
    
    val castMembers = remember(castJson) {
        try {
            val array = org.json.JSONArray(castJson)
            val list = mutableListOf<CastMember>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val profileUrl = if (obj.has("profile_url") && !obj.isNull("profile_url")) {
                    obj.optString("profile_url").takeIf { it.isNotBlank() && it != "null" }
                } else {
                    null
                }
                list.add(
                    CastMember(
                        name = obj.optString("name", ""),
                        character = obj.optString("character", ""),
                        profile_url = profileUrl
                    )
                )
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    if (castMembers.isNotEmpty()) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 16.dp)) {
                Text(
                    text = "Cast",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.width(12.dp))
                Surface(
                    color = Color.White.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(50)
                ) {
                    Text(
                        text = "${castMembers.size}",
                        color = GrayText,
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }
            
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(horizontal = 24.dp)
            ) {
                items(castMembers) { actor ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.width(100.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(90.dp)
                                .clip(CircleShape)
                                .background(SurfaceColor)
                                .border(2.dp, Color.White.copy(alpha = 0.05f), CircleShape)
                        ) {
                            if (actor.profile_url != null) {
                                AsyncImage(
                                    model = org.knp.vortex.utils.formatImageUrl(actor.profile_url, serverUrl),
                                    contentDescription = actor.name,
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = GrayText,
                                    modifier = Modifier.align(Alignment.Center).size(32.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = actor.name,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = actor.character,
                            style = MaterialTheme.typography.labelSmall,
                            color = GrayText,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}
