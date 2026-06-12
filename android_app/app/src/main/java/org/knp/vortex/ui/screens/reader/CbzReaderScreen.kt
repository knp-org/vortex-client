package org.knp.vortex.ui.screens.reader

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import org.knp.vortex.ui.components.GlassyTopBar
import org.knp.vortex.ui.theme.SurfaceColor

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun CbzReaderScreen(
    mediaId: Long,
    viewModel: ReaderViewModel,
    onBack: () -> Unit,
    onNextChapter: (Long) -> Unit = {}
) {
    val pageCount by viewModel.pageCount.collectAsState()
    val readingStyle by viewModel.readingStyle.collectAsState()
    val nextChapterId by viewModel.nextChapterId.collectAsState()
    val serverUrl = viewModel.getServerUrl()
    
    var showControls by remember { mutableStateOf(false) }
    var showSettingsMenu by remember { mutableStateOf(false) }

    if (pageCount > 0) {
        val totalPages = if (nextChapterId != null) pageCount + 1 else pageCount
        val pagerState = rememberPagerState(pageCount = { totalPages })
        val listState = rememberLazyListState()

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onTap = { showControls = !showControls }
                    )
                }
        ) {
            when (readingStyle) {
                ReadingStyle.HORIZONTAL_LTR, ReadingStyle.HORIZONTAL_RTL -> {
                    HorizontalPager(
                        state = pagerState,
                        modifier = Modifier.fillMaxSize(),
                        reverseLayout = readingStyle == ReadingStyle.HORIZONTAL_RTL,
                        key = { it }
                    ) { page ->
                        if (page < pageCount) {
                            PageImage(page, mediaId, serverUrl)
                        } else {
                            NextChapterScreen(nextChapterId, onNextChapter)
                        }
                    }
                }
                ReadingStyle.VERTICAL -> {
                    VerticalPager(
                        state = pagerState,
                        modifier = Modifier.fillMaxSize(),
                        key = { it }
                    ) { page ->
                        if (page < pageCount) {
                            PageImage(page, mediaId, serverUrl)
                        } else {
                            NextChapterScreen(nextChapterId, onNextChapter)
                        }
                    }
                }
                ReadingStyle.WEBTOON -> {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(pageCount) { page ->
                            AsyncImage(
                                model = ImageRequest.Builder(LocalContext.current)
                                    .data("$serverUrl/api/v1/books/$mediaId/page/$page")
                                    .crossfade(true)
                                    .build(),
                                contentDescription = "Page ${page + 1}",
                                modifier = Modifier.fillMaxWidth(),
                                contentScale = ContentScale.FillWidth
                            )
                        }
                        // Always show an end-of-chapter panel in webtoon mode so the
                        // "Read Next Chapter" action is reliably reachable (and the
                        // reader gives clear "End of Series" feedback when there's none).
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(300.dp)
                                    .background(Color.Black),
                                contentAlignment = Alignment.Center
                            ) {
                                if (nextChapterId != null) {
                                    Button(
                                        onClick = { onNextChapter(nextChapterId!!) },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.2f), contentColor = Color.White)
                                    ) {
                                        Icon(Icons.Filled.ArrowForward, contentDescription = null)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Read Next Chapter")
                                    }
                                } else {
                                    Text(
                                        text = "End of Series",
                                        color = Color.White,
                                        style = MaterialTheme.typography.titleLarge
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (showControls) {
                val currentDisplayPage = if (readingStyle == ReadingStyle.WEBTOON) listState.firstVisibleItemIndex + 1 else pagerState.currentPage + 1
                val displayPageText = if (currentDisplayPage > pageCount) "End of Chapter" else "$currentDisplayPage / $pageCount"
                
                // Top Bar using Liquid Glass
                GlassyTopBar(
                    title = displayPageText,
                    onBack = onBack,
                    containerColor = Color.Black.copy(alpha = 0.6f),
                    actions = {
                        Box {
                            IconButton(onClick = { showSettingsMenu = true }) {
                                Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.White)
                            }
                            
                            DropdownMenu(
                                expanded = showSettingsMenu,
                                onDismissRequest = { showSettingsMenu = false },
                                modifier = Modifier.background(SurfaceColor)
                            ) {
                                val styles = listOf(
                                    ReadingStyle.HORIZONTAL_LTR to "Left to Right",
                                    ReadingStyle.HORIZONTAL_RTL to "Right to Left",
                                    ReadingStyle.VERTICAL to "Vertical",
                                    ReadingStyle.WEBTOON to "Webtoon"
                                )
                                
                                styles.forEach { (style, label) ->
                                    DropdownMenuItem(
                                        text = { Text(label, color = Color.White) },
                                        trailingIcon = if (readingStyle == style) {
                                            { Icon(Icons.Default.Check, tint = Color.White, contentDescription = null) }
                                        } else null,
                                        onClick = {
                                            viewModel.updateReadingStyle(mediaId, style)
                                            showSettingsMenu = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                )
            }
        }
    } else {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = Color.White)
        }
    }
}

@Composable
fun PageImage(page: Int, mediaId: Long, serverUrl: String) {
    val imageUrl = "$serverUrl/api/v1/books/$mediaId/page/$page"
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(imageUrl)
            .crossfade(true)
            .build(),
        contentDescription = "Page ${page + 1}",
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Fit
    )
}

@Composable
fun NextChapterScreen(nextChapterId: Long?, onNextChapter: (Long) -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize().background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        if (nextChapterId != null) {
            Button(
                onClick = { onNextChapter(nextChapterId) },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.2f), contentColor = Color.White)
            ) {
                Icon(Icons.Filled.ArrowForward, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Read Next Chapter")
            }
        } else {
            Text(
                text = "End of Series",
                color = Color.White,
                style = MaterialTheme.typography.titleLarge
            )
        }
    }
}
