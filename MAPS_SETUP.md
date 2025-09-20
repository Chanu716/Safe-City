# Google Maps Setup Guide for Safe-City

## Prerequisites
- Google Cloud Platform account
- Project with billing enabled
- Google Maps JavaScript API enabled

## Step-by-Step Setup

### 1. Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one

### 2. Enable Required APIs
Go to **APIs & Services** → **Library** and enable:
- **Maps JavaScript API** ✅
- **Places API** (for location search) ✅
- **Geocoding API** (for address lookup) ✅

### 3. Create API Key (if not already done)
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy your API key
4. Click **Restrict Key** and add restrictions:
   - **Application restrictions**: HTTP referrers
   - Add your domains: `localhost:3000`, `your-domain.com`
   - **API restrictions**: Select the APIs you enabled above

### 4. Create Map ID
1. Go to [Google Maps Platform](https://console.cloud.google.com/google/maps-apis)
2. Click **Map Management** in the left sidebar
3. Click **Create Map ID**
4. Fill in:
   - **Map Name**: `Safe-City-Map`
   - **Map Type**: `JavaScript`
   - **Description**: `Map for Safe City incident reporting`
5. Click **Save**
6. **Copy the Map ID** (it looks like: `abcd1234efgh5678`)

### 5. Configure Your Application

#### Option 1: Update maps-config.js
1. Open `public/js/maps-config.js`
2. Replace `YOUR_MAP_ID_HERE` with your actual Map ID:
   ```javascript
   mapId: 'abcd1234efgh5678', // Your actual Map ID
   ```

#### Option 2: Set Environment Variable
Add to your `.env` file:
```
GOOGLE_MAPS_MAP_ID=abcd1234efgh5678
```

### 6. Update Default Location (Optional)
In `maps-config.js`, change the default location to your preferred city:
```javascript
defaultLocation: { lat: YOUR_LAT, lng: YOUR_LNG },
```

### 7. Test Your Setup
1. Restart your application
2. Navigate to the report page
3. The map should load without console errors
4. Advanced Markers should work if Map ID is properly configured

## Troubleshooting

### Common Issues:

**"Map ID not valid"**
- Ensure Map ID is correctly copied from Google Cloud Console
- Check that the Map ID is associated with your current project

**"This page can't load Google Maps correctly"**
- Check API key restrictions
- Ensure billing is enabled on your Google Cloud project
- Verify APIs are enabled

**"Advanced Markers not working"**
- Ensure Map ID is configured (not using DEMO_MAP_ID)
- Check that marker library is loaded: `&libraries=marker`

### Support
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Advanced Markers Guide](https://developers.google.com/maps/documentation/javascript/advanced-markers)

## Security Notes
- Never commit API keys to version control
- Use environment variables for production
- Restrict API keys to specific domains
- Monitor API usage in Google Cloud Console