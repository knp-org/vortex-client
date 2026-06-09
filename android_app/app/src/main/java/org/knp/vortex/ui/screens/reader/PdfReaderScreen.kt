package org.knp.vortex.ui.screens.reader

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.flow.distinctUntilChanged

@Composable
fun PdfReaderScreen(
    mediaId: Long,
    title: String? = null,
    onBack: () -> Unit,
    viewModel: PdfReaderViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(mediaId) { viewModel.load(mediaId) }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        when {
            state.isLoading -> {
                CircularProgressIndicator(
                    color = Color.White,
                    modifier = Modifier.align(Alignment.Center),
                )
            }
            state.error != null -> {
                Text(
                    text = state.error ?: "Failed to open PDF",
                    color = Color(0xFFFF6B6B),
                    modifier = Modifier.align(Alignment.Center).padding(24.dp),
                )
            }
            else -> {
                if (state.readingMode == PdfReadingMode.Horizontal) {
                    HorizontalPdf(state, viewModel)
                } else {
                    VerticalPdf(state, viewModel)
                }
            }
        }

        // Top toolbar overlay.
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xCC000000))
                .padding(horizontal = 4.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Text(
                text = title ?: "Reading",
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )
            if (state.pageCount > 0) {
                Text(
                    text = "${state.currentPage + 1} / ${state.pageCount}",
                    color = Color(0xFFB0B0B0),
                    modifier = Modifier.padding(horizontal = 8.dp),
                )
            }
            IconButton(onClick = {
                val next = if (state.readingMode == PdfReadingMode.Vertical) {
                    PdfReadingMode.Horizontal
                } else {
                    PdfReadingMode.Vertical
                }
                viewModel.setReadingMode(next)
            }) {
                Icon(
                    Icons.AutoMirrored.Filled.List,
                    contentDescription = "Reading mode",
                    tint = Color.White,
                )
            }
        }
    }
}

@Composable
private fun VerticalPdf(state: PdfReaderState, viewModel: PdfReaderViewModel) {
    val listState = rememberLazyListState(initialFirstVisibleItemIndex = state.currentPage)

    LaunchedEffect(listState) {
        snapshotFlow { listState.firstVisibleItemIndex }
            .distinctUntilChanged()
            .collect { viewModel.setPage(it) }
    }

    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(state.pageCount) { index ->
            PdfPage(index = index, viewModel = viewModel, fillHeight = false)
        }
    }
}

@Composable
private fun HorizontalPdf(state: PdfReaderState, viewModel: PdfReaderViewModel) {
    val pagerState = rememberPagerState(
        initialPage = state.currentPage,
        pageCount = { state.pageCount },
    )

    LaunchedEffect(pagerState) {
        snapshotFlow { pagerState.currentPage }
            .distinctUntilChanged()
            .collect { viewModel.setPage(it) }
    }

    HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { index ->
        PdfPage(index = index, viewModel = viewModel, fillHeight = true)
    }
}

@Composable
private fun PdfPage(index: Int, viewModel: PdfReaderViewModel, fillHeight: Boolean) {
    val density = LocalDensity.current
    val configuration = LocalConfiguration.current
    val widthPx = remember(configuration.screenWidthDp, density) {
        with(density) { configuration.screenWidthDp.dp.toPx() }.toInt()
    }

    var bitmap by remember(index) { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(index, widthPx) {
        bitmap = viewModel.renderPage(index, widthPx)
    }

    val bmp = bitmap
    if (bmp != null) {
        Image(
            bitmap = bmp.asImageBitmap(),
            contentDescription = "Page ${index + 1}",
            contentScale = if (fillHeight) ContentScale.Fit else ContentScale.FillWidth,
            modifier = if (fillHeight) Modifier.fillMaxSize() else Modifier.fillMaxWidth(),
        )
    } else {
        // Reserve roughly a page of height so the scroll position stays stable
        // while the bitmap renders.
        Box(
            modifier = if (fillHeight) {
                Modifier.fillMaxSize()
            } else {
                Modifier.fillMaxWidth().aspectRatio(0.7f)
            },
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator(color = Color.White)
        }
    }
}
