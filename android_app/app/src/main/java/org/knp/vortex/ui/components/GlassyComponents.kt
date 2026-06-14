package org.knp.vortex.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.res.painterResource
import org.knp.vortex.R
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos

import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.ui.graphics.asImageBitmap
import kotlinx.coroutines.launch
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import org.knp.vortex.ui.theme.*
import androidx.compose.animation.core.*
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset

@Composable
fun GlassyTopBar(
    title: String,
    onBack: (() -> Unit)? = null,
    containerColor: Color = DeepBackground.copy(alpha = 0.4f),
    actions: @Composable RowScope.() -> Unit = {}
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(64.dp)
            .background(containerColor) // Consider adding blur in the future if enabled
            .padding(horizontal = 16.dp)
    ) {
        if (onBack != null) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.align(Alignment.CenterStart)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }
        }
        
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.align(Alignment.Center)
        )
        
        Row(
            modifier = Modifier.align(Alignment.CenterEnd),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            content = actions
        )
        
        // Bottom subtle border
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(0.5.dp)
                .background(Color.White.copy(alpha = 0.1f))
        )
    }
}

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun AppHeader(
    title: String? = null,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    onLogoLongClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    actions: @Composable RowScope.() -> Unit = {}
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(DeepBackground.copy(alpha = 0.4f))
            .padding(horizontal = 16.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Spacer(modifier = Modifier.width(8.dp))

        if (onBack != null) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Spacer(modifier = Modifier.width(4.dp))
        }

        Image(
            painter = painterResource(id = R.drawable.ic_logo_full),
            contentDescription = "Logo",
            modifier = Modifier
                .size(32.dp)
                .combinedClickable(
                    onClick = {},
                    onLongClick = onLogoLongClick
                )
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            if (title != null) {
                Text(
                    text = title, 
                    color = Color.White, 
                    fontWeight = FontWeight.ExtraBold, 
                    style = MaterialTheme.typography.titleLarge,
                    letterSpacing = 0.sp
                )
            }
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    color = GrayText,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
        
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            content = actions
        )
    }
}

@Composable
fun ModernMediaCard(
    title: String?,
    posterUrl: String?,
    year: Long? = null,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    videoUrl: String? = null,
    aspectRatio: Float = 0.67f // portrait poster by default; pass 16f/9f for landscape (e.g. music videos)
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val imageRequest = androidx.compose.runtime.remember(posterUrl, videoUrl) {
        coil.request.ImageRequest.Builder(context)
            .data(posterUrl ?: videoUrl)
            .crossfade(true)
            .allowHardware(false) // Better compatibility for video frames
            .size(512) // Limit size for performance
            .apply {
                if (posterUrl == null && videoUrl != null) {
                    // Extract frame from 1 second in
                    setParameter("video_frame_micros", 1_000_000L)
                }
            }
            .build()
    }

    GlassyCard(
        modifier = modifier
            .aspectRatio(aspectRatio)
            .bounceClick(onClick = onClick), // Apply bounce click
        shape = RoundedCornerShape(16.dp)
        // Note: onClick handled by bounceClick now, so we don't pass it to Surface inside GlassyCard or we refactor GlassyCard.
        // Let's pass null to GlassyCard's onClick to avoid double click handling, since bounceClick handles it.
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            if (posterUrl != null || videoUrl != null) {
                var isError by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
                var isLoading by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(true) }

                if (!isError) {
                    AsyncImage(
                        model = imageRequest,
                        contentDescription = title,
                        modifier = Modifier
                            .fillMaxSize()
                            .shimmerEffect(isActive = isLoading), // Shimmer while loading
                        contentScale = ContentScale.Crop,
                        onSuccess = { isLoading = false },
                        onError = { 
                            isError = true 
                            isLoading = false
                        }
                    )
                } else {
                    Box(Modifier.fillMaxSize().background(Color.White.copy(alpha = 0.05f)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Filled.PlayArrow, contentDescription = null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(48.dp))
                    }
                }
                
                // If it's a video thumbnail (no poster), show a subtle play icon overlay
                if (posterUrl == null && videoUrl != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = Color.White.copy(alpha = 0.7f),
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF12121A), Color(0xFF1A1A2E))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.3f),
                        modifier = Modifier.size(48.dp)
                    )
                }
            }
            
            // Gradient Overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.8f)),
                            startY = 300f
                        )
                    )
            )
            
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(12.dp)
            ) {
                Text(
                    text = title ?: "Unknown",
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.White,
                    maxLines = 1,
                    fontWeight = FontWeight.Bold
                )
                if (year != null && year > 0) {
                    Text(
                        text = "$year",
                        style = MaterialTheme.typography.bodySmall,
                        color = GrayText.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}

@Composable
fun SectionHeader(
    title: String, 
    onSeeAll: (() -> Unit)? = null,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 24.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            if (onClick != null) {
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    imageVector = androidx.compose.material.icons.Icons.AutoMirrored.Filled.ArrowForwardIos,
                    contentDescription = null,
                    tint = GrayText.copy(alpha = 0.5f),
                    modifier = Modifier.size(14.dp)
                )
            }
        }
        if (onSeeAll != null) {
            Text(
                text = "See All",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White,
                modifier = Modifier.clickable { onSeeAll() }
            )
        }
    }
}

@Composable
fun GlassyBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "LiquidGlassyBackgroundTransition")
    
    // Animate coordinates for the dynamic glowing liquid circles
    val xOffset1 by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "xOffset1"
    )
    val yOffset1 by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(15000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "yOffset1"
    )
    
    val xOffset2 by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 0.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(18000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "xOffset2"
    )
    val yOffset2 by infiniteTransition.animateFloat(
        initialValue = 0.7f,
        targetValue = 0.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(14000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "yOffset2"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .drawWithCache {
                val brush1 = Brush.radialGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.05f), // Subtle monochrome glow
                        Color.Transparent
                    ),
                    center = Offset(
                        size.width * xOffset1,
                        size.height * yOffset1
                    ),
                    radius = size.minDimension * 0.8f
                )
                val brush2 = Brush.radialGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.03f), // Another subtle monochrome glow
                        Color.Transparent
                    ),
                    center = Offset(
                        size.width * xOffset2,
                        size.height * yOffset2
                    ),
                    radius = size.minDimension * 0.7f
                )
                onDrawBehind {
                    // Deep dark monochrome void base
                    drawRect(Color(0xFF080808))
                    
                    // Draw liquid monochrome glows
                    drawRect(brush = brush1)
                    drawRect(brush = brush2)
                    
                    // Overlay a translucent dark glassy layer
                    drawRect(Color(0xFF000000).copy(alpha = 0.4f))
                }
            }
    ) {
        content()
    }
}

@Composable
fun GlassySurface(
    modifier: Modifier = Modifier,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(12.dp),
    color: Color = Color.White.copy(alpha = 0.12f), // Increased from 0.08
    content: @Composable () -> Unit
) {
    Surface(
        modifier = modifier,
        shape = shape,
        color = color,
        border = androidx.compose.foundation.BorderStroke(
            1.dp, 
            Brush.linearGradient(
                listOf(
                    Color.White.copy(alpha = 0.35f), // Increased from 0.3
                    Color.White.copy(alpha = 0.05f)
                )
            )
        ),
        content = content
    )
}

@Composable
fun GlassyCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(16.dp),
    color: Color = Color.Unspecified, // Defaults to Unspecified to trigger the frosted gradient
    content: @Composable () -> Unit
) {
    val baseModifier = modifier.clip(shape)
    val cardModifier = if (onClick != null) {
        baseModifier.clickable(onClick = onClick)
    } else {
        baseModifier
    }

    Box(
        modifier = cardModifier
            .then(
                if (color != Color.Unspecified) {
                    Modifier.background(color)
                } else {
                    Modifier.background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.20f), // Top-left brighter frosted glass
                                Color.White.copy(alpha = 0.06f)  // Bottom-right darker glassy fade
                            )
                        )
                    )
                }
            )
            .border(
                1.dp,
                Brush.linearGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.4f),  // Top-left strong border highlight
                        Color.White.copy(alpha = 0.05f)  // Bottom-right subtle border
                    )
                ),
                shape = shape
            )
    ) {
        content()
    }
}

@Composable
fun GlassyTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    keyboardOptions: androidx.compose.foundation.text.KeyboardOptions = androidx.compose.foundation.text.KeyboardOptions.Default,
    singleLine: Boolean = true,
    readOnly: Boolean = false,
    trailingIcon: @Composable (() -> Unit)? = null
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier,
        singleLine = singleLine,
        readOnly = readOnly,
        keyboardOptions = keyboardOptions,
        trailingIcon = trailingIcon,
        shape = RoundedCornerShape(16.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White,
            focusedContainerColor = Color.White.copy(alpha = 0.05f), // 5% white fill
            unfocusedContainerColor = Color.White.copy(alpha = 0.05f), // 5% white fill
            focusedBorderColor = Color.White.copy(alpha = 0.5f), // 50% opacity white on focus
            unfocusedBorderColor = Color.White.copy(alpha = 0.1f), // Subtle border
            focusedLabelColor = Color.White,
            unfocusedLabelColor = GrayText,
            cursorColor = Color.White
        )
    )
}

@Composable
fun GlassyDialog(
    onDismissRequest: () -> Unit,
    title: String,
    content: @Composable () -> Unit,
    confirmButton: @Composable () -> Unit,
    dismissButton: @Composable () -> Unit
) {
    androidx.compose.ui.window.Dialog(onDismissRequest = onDismissRequest) {
        GlassySurface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(24.dp),
            color = DeepBackground.copy(alpha = 0.95f) // Dark base for readability
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(16.dp))
                content()
                Spacer(modifier = Modifier.height(24.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    dismissButton()
                    Spacer(modifier = Modifier.width(8.dp))
                    confirmButton()
                }
            }
        }
    }
}

@Composable
fun GlassyBottomNavigation(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(16.dp) // Floating dock padding
    ) {
        // Glassy Dock Background mimicking GlassyCard exactly
        GlassyCard(
            modifier = Modifier.matchParentSize(),
            shape = RoundedCornerShape(32.dp)
        ) {}

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(72.dp), // Dock height
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
            content = content
        )
    }
}

@Composable
fun GlassyBottomNavItem(
    selected: Boolean,
    onClick: () -> Unit,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String
) {
    val color = if (selected) Color.White else Color.White.copy(alpha = 0.4f)
    val bgColor = if (selected) Color.White.copy(alpha = 0.15f) else Color.Transparent
    
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(bgColor),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            fontSize = 10.sp
        )
    }
}
