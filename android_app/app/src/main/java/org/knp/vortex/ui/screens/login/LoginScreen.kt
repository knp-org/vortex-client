package org.knp.vortex.ui.screens.login

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import org.knp.vortex.R
import org.knp.vortex.ui.components.GlassyBackground
import org.knp.vortex.ui.components.GlassySurface
import org.knp.vortex.ui.components.GlassyTextField


@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()

    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isRegistering by remember { mutableStateOf(false) }
    var showPassword by remember { mutableStateOf(false) }

    GlassyBackground {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            org.knp.vortex.ui.components.GlassyCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Logo
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .padding(8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_logo_full),
                            contentDescription = "Vortex Logo",
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Vortex",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 28.sp
                    )
                    Text(
                        text = "Secure Streaming",
                        color = Color.Gray,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.sp
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    GlassyTextField(
                        value = serverUrl,
                        onValueChange = { viewModel.setServerUrl(it) },
                        label = "Server URL",
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    GlassyTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = "Username",
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedContainerColor = Color.White.copy(alpha = 0.05f),
                            unfocusedContainerColor = Color.White.copy(alpha = 0.05f),
                            focusedBorderColor = Color.White.copy(alpha = 0.5f),
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                            focusedLabelColor = Color.White,
                            unfocusedLabelColor = Color.Gray,
                            cursorColor = Color.White
                        ),
                        trailingIcon = {
                            Text(
                                text = if (showPassword) "Hide" else "Show",
                                color = Color.Gray,
                                modifier = Modifier
                                    .padding(end = 16.dp)
                                    .clickable { showPassword = !showPassword }
                            )
                        }
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    if (uiState.error != null) {
                        Text(
                            text = uiState.error!!,
                            color = if (uiState.isRegistrationSuccess) Color.White else Color(0xFFffb4ab),
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                    }

                    Button(
                        onClick = {
                            viewModel.loginOrRegister(
                                username = username,
                                password = password,
                                isRegistering = isRegistering,
                                onSuccess = onLoginSuccess
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        enabled = !uiState.isLoading,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = Color.Black,
                            disabledContainerColor = Color.White.copy(alpha = 0.5f)
                        ),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp)
                    ) {
                        Text(
                            text = if (uiState.isLoading) "Processing..." else if (isRegistering) "Create Account" else "Sign In",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = if (isRegistering) "Already have an account? Sign In" else "Don't have an account? Register",
                        color = Color.Gray,
                        fontSize = 14.sp,
                        modifier = Modifier.clickable { 
                            isRegistering = !isRegistering 
                            if (isRegistering) password = ""
                        }
                    )
                }
            }
        }
    }
}
