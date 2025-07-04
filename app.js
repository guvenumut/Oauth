const express = require('express');
const path = require('path');
require('dotenv').config();
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('index', { 
        title: 'OAuth Demo',
        message: 'Welcome to OAuth Demo'
    });
});

app.get('/auth/github', (req, res) => {
    const redirectUri = 'http://localhost:3000/auth/github/callback';
    const clientId = process.env.GITHUB_CLIENT_ID;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    res.redirect(url);
});

app.get('/auth/github/callback', async (req, res) => {
	const code = req.query.code;

	const tokenRes = await axios.post(
		'https://github.com/login/oauth/access_token',
		{
			client_id: process.env.GITHUB_CLIENT_ID,
			client_secret: process.env.GITHUB_CLIENT_SECRET,
			code,
		},
		{
			headers: {
				Accept: 'application/json',
			},
		}
	);

	const accessToken = tokenRes.data.access_token;

	const userRes = await axios.get('https://api.github.com/user', {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	const emailRes = await axios.get('https://api.github.com/user/emails', {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
    

	const email = emailRes.data.find((e) => e.primary && e.verified)?.email;

	console.log('✅ GitHub user:', {
		name: userRes.data.name,
		email,
	});

	res.redirect('http://localhost:3000/success');
});

    
app.get("/auth/google", (req, res) => {
    const redirectUri = 'http://localhost:3000/auth/google/callback';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile`;
    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
	const code = req.query.code;
	const redirectUri = 'http://localhost:3000/auth/google/callback';

	try {
		const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
			client_id: process.env.GOOGLE_CLIENT_ID,
			client_secret: process.env.GOOGLE_CLIENT_SECRET,
			code,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code',
		});

		const accessToken = tokenRes.data.access_token;

		const profileRes = await axios.get(
			'https://www.googleapis.com/oauth2/v2/userinfo',
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);

		console.log('🔗 Google User:', {
			name: profileRes.data.name,
			email: profileRes.data.email,
		});

		res.redirect('http://localhost:3000/success');
	} catch (err) {
		console.error('Google OAuth Error:', err);
		res.send('Google login failed');
	}
});




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 