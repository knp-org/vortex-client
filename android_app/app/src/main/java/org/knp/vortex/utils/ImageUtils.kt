package org.knp.vortex.utils

/**
 * Formats a given image URL from the API.
 * If the URL is already an absolute HTTP/HTTPS URL, it returns it as-is.
 * If the URL is just a filename (e.g. from TVDB or local upload), it prepends the server's image API endpoint.
 */
fun formatImageUrl(url: String?, serverUrl: String): String? {
    if (url.isNullOrBlank()) return null
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url
    }
    val baseUrl = serverUrl.trimEnd('/')
    // Ensure we don't duplicate the /api/v1/images/ part if it's already there
    if (url.startsWith("/api/v1/images/")) {
        return "$baseUrl$url"
    }
    // Remove leading slash if any before appending
    val cleanUrl = url.trimStart('/')
    return "$baseUrl/api/v1/images/$cleanUrl"
}
