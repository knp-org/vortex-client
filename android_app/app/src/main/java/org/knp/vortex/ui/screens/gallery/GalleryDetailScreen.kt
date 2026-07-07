package org.knp.vortex.ui.screens.gallery

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.calculatePan
import androidx.compose.foundation.gestures.calculateZoom
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import kotlinx.coroutines.launch
import org.knp.vortex.data.remote.ImageDto
import org.knp.vortex.ui.screens.library.LibraryEmpty
import org.knp.vortex.ui.screens.library.LibraryError
import org.knp.vortex.ui.screens.library.LibraryLoading
import org.knp.vortex.ui.screens.library.LibraryScaffold
import org.knp.vortex.ui.screens.library.serverPathUrl

/**
 * A photo album: square thumbnail grid; tapping a photo opens a full-screen lightbox
 * with swipe next/prev, pinch and double-tap zoom, and tap-to-toggle chrome.
 * Thumbnails use the public thumbnail endpoint; the full-size photo endpoint is behind
 * auth, so the lightbox appends the `?token=` query the server accepts.
 */
@Composable
fun GalleryDetailScreen(
    onBack: () -> Unit,
    viewModel: GalleryDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var lightboxIndex by remember { mutableStateOf<Int?>(null) }

    LibraryScaffold(title = uiState.gallery?.name ?: "Album", onBack = onBack) {
        when {
            uiState.isLoading -> LibraryLoading()
            uiState.error != null -> LibraryError(uiState.error)
            uiState.gallery?.images.isNullOrEmpty() -> LibraryEmpty("This album has no photos yet.")
            else -> {
                val images = uiState.gallery!!.images
                uiState.gallery!!.description?.takeIf { it.isNotBlank() }?.let { desc ->
                    Text(
                        text = desc,
                        color = Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(minSize = 100.dp),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    itemsIndexed(images) { index, image ->
                        AsyncImage(
                            model = serverPathUrl(image.thumb_url, uiState.serverUrl),
                            contentDescription = image.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.White.copy(alpha = 0.06f))
                                .clickable { lightboxIndex = index }
                        )
                    }
                }
            }
        }
    }

    lightboxIndex?.let { start ->
        val images = uiState.gallery?.images.orEmpty()
        if (images.isNotEmpty()) {
            PhotoLightbox(
                images = images,
                startIndex = start.coerceIn(0, images.lastIndex),
                fullUrl = { viewModel.fullImageUrl(it) },
                thumbUrl = { serverPathUrl(it.thumb_url, uiState.serverUrl) },
                onDismiss = { lightboxIndex = null }
            )
        }
    }
}

/**
 * Full-screen lightbox: swipe (or chevron-tap) between photos, pinch or double-tap to
 * zoom, drag to pan while zoomed, single tap to show/hide the chrome. Back dismisses.
 *
 * Zoom gestures are hand-rolled instead of `detectTransformGestures` because that
 * detector consumes single-finger drags even at 1x, which would block the pager's swipe:
 * here events are only consumed for multi-touch, or any touch while zoomed in.
 */
@Composable
private fun PhotoLightbox(
    images: List<ImageDto>,
    startIndex: Int,
    fullUrl: (ImageDto) -> String,
    thumbUrl: (ImageDto) -> String?,
    onDismiss: () -> Unit
) {
    val pagerState = rememberPagerState(initialPage = startIndex) { images.size }
    val scope = rememberCoroutineScope()
    var chromeVisible by remember { mutableStateOf(true) }

    BackHandler(onBack = onDismiss)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
            beyondViewportPageCount = 1
        ) { page ->
            var scale by remember { mutableFloatStateOf(1f) }
            var offsetX by remember { mutableFloatStateOf(0f) }
            var offsetY by remember { mutableFloatStateOf(0f) }

            // Reset zoom once the photo is swiped away so it reopens at 1x.
            LaunchedEffect(pagerState.settledPage) {
                if (pagerState.settledPage != page) {
                    scale = 1f; offsetX = 0f; offsetY = 0f
                }
            }

            fun clampOffsets(boxWidth: Int, boxHeight: Int) {
                val maxX = boxWidth * (scale - 1f) / 2f
                val maxY = boxHeight * (scale - 1f) / 2f
                offsetX = offsetX.coerceIn(-maxX, maxX)
                offsetY = offsetY.coerceIn(-maxY, maxY)
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(page) {
                        detectTapGestures(
                            onTap = { chromeVisible = !chromeVisible },
                            onDoubleTap = {
                                if (scale > 1f) {
                                    scale = 1f; offsetX = 0f; offsetY = 0f
                                } else {
                                    scale = 2.5f
                                }
                            }
                        )
                    }
                    .pointerInput(page) {
                        // Pinch-zoom + pan-while-zoomed. Consumes events only for
                        // multi-touch or when zoomed, so 1x single-finger drags fall
                        // through to the pager (easy swipe next/prev).
                        awaitEachGesture {
                            awaitFirstDown(requireUnconsumed = false)
                            while (true) {
                                val event = awaitPointerEvent()
                                if (event.changes.none { it.pressed }) break
                                val multiTouch = event.changes.size > 1
                                if (!multiTouch && scale <= 1f) continue

                                scale = (scale * event.calculateZoom()).coerceIn(1f, 6f)
                                if (scale > 1f) {
                                    val pan = event.calculatePan()
                                    offsetX += pan.x
                                    offsetY += pan.y
                                    clampOffsets(size.width, size.height)
                                } else {
                                    offsetX = 0f; offsetY = 0f
                                }
                                event.changes.forEach { it.consume() }
                            }
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                // Instant preview: the (usually cached) thumbnail sits behind the
                // full-resolution photo, which pops in over it once loaded.
                thumbUrl(images[page])?.let { thumb ->
                    AsyncImage(
                        model = thumb,
                        contentDescription = null,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .fillMaxSize()
                            .graphicsLayer(
                                scaleX = scale, scaleY = scale,
                                translationX = offsetX, translationY = offsetY
                            )
                    )
                }
                AsyncImage(
                    model = fullUrl(images[page]),
                    contentDescription = images[page].title,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer(
                            scaleX = scale, scaleY = scale,
                            translationX = offsetX, translationY = offsetY
                        )
                )
            }
        }

        AnimatedVisibility(
            visible = chromeVisible,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(Modifier.fillMaxSize()) {
                // Top bar: photo counter + close.
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                        .background(Color.Black.copy(alpha = 0.45f))
                        .statusBarsPadding()
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${pagerState.currentPage + 1} / ${images.size}",
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(start = 12.dp).weight(1f)
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                }

                // Prev/next chevrons for one-tap navigation.
                if (pagerState.currentPage > 0) {
                    IconButton(
                        onClick = { scope.launch { pagerState.animateScrollToPage(pagerState.currentPage - 1) } },
                        modifier = Modifier
                            .align(Alignment.CenterStart)
                            .padding(8.dp)
                            .background(Color.Black.copy(alpha = 0.35f), CircleShape)
                    ) {
                        Icon(Icons.Default.KeyboardArrowLeft, contentDescription = "Previous photo", tint = Color.White)
                    }
                }
                if (pagerState.currentPage < images.lastIndex) {
                    IconButton(
                        onClick = { scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) } },
                        modifier = Modifier
                            .align(Alignment.CenterEnd)
                            .padding(8.dp)
                            .background(Color.Black.copy(alpha = 0.35f), CircleShape)
                    ) {
                        Icon(Icons.Default.KeyboardArrowRight, contentDescription = "Next photo", tint = Color.White)
                    }
                }

                // Bottom caption.
                images.getOrNull(pagerState.currentPage)?.let { image ->
                    val caption = listOfNotNull(
                        image.title,
                        image.taken_at?.take(10)
                    ).joinToString("  ·  ")
                    if (caption.isNotBlank()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .align(Alignment.BottomCenter)
                                .background(Color.Black.copy(alpha = 0.45f))
                                .padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = caption,
                                color = Color.White.copy(alpha = 0.9f),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }
        }
    }
}
