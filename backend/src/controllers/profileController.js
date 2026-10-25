const cloudinary = require('cloudinary').v2;
const User = require('../models/user');
const Submission = require('../models/submission');
const Streak = require('../models/Streak');

// Configure Cloudinary (using existing config from videoSection.js)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get user profile with aggregated statistics
const getProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.result._id;

        // Fetch user data
        const user = await User.findById(userId)
            .select('-password')
            .populate('problemSolved', 'title difficulty');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch submissions to calculate language statistics
        const submissions = await Submission.find({ userId });

        // Calculate language usage
        const languageStats = submissions.reduce((acc, submission) => {
            const lang = submission.language;
            acc[lang] = (acc[lang] || 0) + 1;
            return acc;
        }, {});

        // Calculate acceptance rate
        const acceptedSubmissions = submissions.filter(s => s.status === 'accepted').length;
        const acceptanceRate = submissions.length > 0
            ? Math.round((acceptedSubmissions / submissions.length) * 100)
            : 0;

        // Fetch streak data
        const streak = await Streak.findOne({ userId }) || { currentStreak: 0, longestStreak: 0 };

        // Calculate badges based on achievements
        const validProblems = (user.problemSolved || []).filter(Boolean);
        const solvedCount = validProblems.length;

        if (solvedCount >= 1) badges.push({ name: 'First Steps', icon: '🎯', description: 'Solved your first problem' });
        if (solvedCount >= 10) badges.push({ name: 'Problem Solver', icon: '💡', description: 'Solved 10 problems' });
        if (solvedCount >= 50) badges.push({ name: 'Code Warrior', icon: '⚔️', description: 'Solved 50 problems' });
        if (solvedCount >= 100) badges.push({ name: 'Code Master', icon: '👑', description: 'Solved 100 problems' });
        if (streak.currentStreak >= 7) badges.push({ name: 'Week Streak', icon: '🔥', description: '7-day streak' });
        if (streak.currentStreak >= 30) badges.push({ name: 'Month Streak', icon: '🌟', description: '30-day streak' });
        if (acceptanceRate >= 80) badges.push({ name: 'Accuracy Expert', icon: '🎖️', description: '80%+ acceptance rate' });

        // Count problems by difficulty
        const difficultyBreakdown = validProblems.reduce((acc, problem) => {
            const diff = problem?.difficulty;
            if (diff && acc[diff] !== undefined) {
                acc[diff] = (acc[diff] || 0) + 1;
            }
            return acc;
        }, { easy: 0, medium: 0, hard: 0 });

        // Build profile response
        const profile = {
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId,
                role: user.role,
                bio: user.bio,
                location: user.location,
                college: user.college,
                profilePicture: user.profilePicture,
                githubId: user.githubId,
                linkedinId: user.linkedinId,
                createdAt: user.createdAt
            },
            statistics: {
                problemsSolved: solvedCount,
                difficultyBreakdown,
                totalSubmissions: submissions.length,
                acceptedSubmissions,
                acceptanceRate,
                currentStreak: streak.currentStreak,
                longestStreak: streak.longestStreak,
                languageStats
            },
            badges,
            recentActivity: submissions
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
                .map(s => ({
                    problemId: s.problemId,
                    language: s.language,
                    status: s.status,
                    createdAt: s.createdAt
                }))
        };

        res.status(200).json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.result._id;
        const { bio, location, college, githubId, linkedinId } = req.body;

        // Validate input lengths
        if (bio && bio.length > 500) {
            return res.status(400).json({ error: 'Bio must be less than 500 characters' });
        }
        if (location && location.length > 100) {
            return res.status(400).json({ error: 'Location must be less than 100 characters' });
        }
        if (college && college.length > 200) {
            return res.status(400).json({ error: 'College name must be less than 200 characters' });
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                bio: bio || '',
                location: location || '',
                college: college || '',
                githubId: githubId || '',
                linkedinId: linkedinId || ''
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.result._id;
        const { imageData } = req.body; // Base64 image data

        if (!imageData) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete old profile picture if exists
        if (user.profilePicturePublicId) {
            try {
                await cloudinary.uploader.destroy(user.profilePicturePublicId);
            } catch (err) {
                console.error('Error deleting old profile picture:', err);
            }
        }

        // Upload new image to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageData, {
            folder: 'profile-pictures',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto' }
            ]
        });

        // Update user with new profile picture
        user.profilePicture = uploadResult.secure_url;
        user.profilePicturePublicId = uploadResult.public_id;
        await user.save();

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicture: uploadResult.secure_url
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
};

// Delete profile picture
const deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.result._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.profilePicturePublicId) {
            return res.status(400).json({ error: 'No profile picture to delete' });
        }

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(user.profilePicturePublicId);

        // Update user
        user.profilePicture = '';
        user.profilePicturePublicId = '';
        await user.save();

        res.status(200).json({ message: 'Profile picture deleted successfully' });
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        res.status(500).json({ error: 'Failed to delete profile picture' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture
};
