const Achievement = require('../models/achievement');
const User = require('../models/user');
const Problem = require('../models/problem');

// Get all available achievements
const getAllAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find().sort({ order: 1 });
        res.status(200).json(achievements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching achievements', error: error.message });
    }
};

// Get user's unlocked achievements
const getUserAchievements = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('unlockedBadges totalPoints');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get full achievement details for unlocked badges
        const badgeIds = user.unlockedBadges.map(b => b.badgeId);
        const achievements = await Achievement.find({ badgeId: { $in: badgeIds } });

        // Merge unlock data with achievement details
        const unlockedWithDetails = user.unlockedBadges.map(unlock => {
            const achievement = achievements.find(a => a.badgeId === unlock.badgeId);
            return {
                ...achievement?.toObject(),
                unlockedAt: unlock.unlockedAt,
                notificationSeen: unlock.notificationSeen
            };
        });

        res.status(200).json({
            unlockedBadges: unlockedWithDetails,
            totalPoints: user.totalPoints,
            totalUnlocked: user.unlockedBadges.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user achievements', error: error.message });
    }
};

// Get badge progress for a user
const getBadgeProgress = async (req, res) => {
    try {
        const userId = req.result?._id || req.user?._id;
        const user = await User.findById(userId).populate('problemSolved');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const allAchievements = await Achievement.find();
        const unlockedBadgeIds = user.unlockedBadges.map(b => b.badgeId);

        // Calculate progress for each locked badge
        const progress = {};

        for (const achievement of allAchievements) {
            if (unlockedBadgeIds.includes(achievement.badgeId)) {
                progress[achievement.badgeId] = {
                    current: achievement.criteria.value,
                    required: achievement.criteria.value,
                    percentage: 100,
                    unlocked: true
                };
                continue;
            }

            let current = 0;
            const required = achievement.criteria.value;

            switch (achievement.criteria.type) {
                case 'problemCount':
                    current = user.problemSolved.length;
                    break;

                case 'difficulty':
                    current = user.problemSolved.filter(p =>
                        p.difficulty === achievement.criteria.difficulty
                    ).length;
                    break;

                case 'topic':
                    current = user.problemSolved.filter(p =>
                        p.tags === achievement.criteria.topic
                    ).length;
                    break;

                case 'streak':
                    // Get from daily challenge streak
                    const streakData = await require('./dailyChallengeController').getUserStreak(userId);
                    current = streakData?.currentStreak || 0;
                    break;

                default:
                    current = 0;
            }

            progress[achievement.badgeId] = {
                current: Math.min(current, required),
                required,
                percentage: Math.min(Math.round((current / required) * 100), 100),
                unlocked: false
            };
        }

        res.status(200).json(progress);
    } catch (error) {
        res.status(500).json({ message: 'Error calculating badge progress', error: error.message });
    }
};

// Check and unlock badges for a user
const checkAndUnlockBadges = async (userId, action) => {
    try {
        const user = await User.findById(userId).populate('problemSolved');
        if (!user) return { newBadges: [] };

        const allAchievements = await Achievement.find();
        const unlockedBadgeIds = user.unlockedBadges.map(b => b.badgeId);
        const newlyUnlocked = [];

        for (const achievement of allAchievements) {
            // Skip if already unlocked
            if (unlockedBadgeIds.includes(achievement.badgeId)) continue;

            let shouldUnlock = false;

            switch (achievement.criteria.type) {
                case 'problemCount':
                    shouldUnlock = user.problemSolved.length >= achievement.criteria.value;
                    break;

                case 'difficulty':
                    const difficultyCount = user.problemSolved.filter(p =>
                        p.difficulty === achievement.criteria.difficulty
                    ).length;
                    shouldUnlock = difficultyCount >= achievement.criteria.value;
                    break;

                case 'topic':
                    const topicCount = user.problemSolved.filter(p =>
                        p.tags === achievement.criteria.topic
                    ).length;
                    shouldUnlock = topicCount >= achievement.criteria.value;
                    break;

                case 'streak':
                    if (action.type === 'streakUpdate' && action.currentStreak) {
                        shouldUnlock = action.currentStreak >= achievement.criteria.value;
                    }
                    break;

                default:
                    shouldUnlock = false;
            }

            if (shouldUnlock) {
                // Unlock the badge
                user.unlockedBadges.push({
                    badgeId: achievement.badgeId,
                    unlockedAt: new Date(),
                    notificationSeen: false
                });
                user.totalPoints += achievement.points;
                newlyUnlocked.push(achievement);
            }
        }

        if (newlyUnlocked.length > 0) {
            await user.save();
        }

        return { newBadges: newlyUnlocked };
    } catch (error) {
        console.error('Error checking badges:', error);
        return { newBadges: [] };
    }
};

// Mark badge notification as seen
const markNotificationSeen = async (req, res) => {
    try {
        const userId = req.result?._id || req.user?._id;
        const { badgeId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const badge = user.unlockedBadges.find(b => b.badgeId === badgeId);
        if (badge) {
            badge.notificationSeen = true;
            await user.save();
        }

        res.status(200).json({ message: 'Notification marked as seen' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking notification', error: error.message });
    }
};

// Get unseen badge notifications
const getUnseenBadges = async (req, res) => {
    try {
        const userId = req.result?._id || req.user?._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const unseenBadges = user.unlockedBadges.filter(b => !b.notificationSeen);
        const badgeIds = unseenBadges.map(b => b.badgeId);
        const achievements = await Achievement.find({ badgeId: { $in: badgeIds } });

        const unseenWithDetails = unseenBadges.map(unlock => {
            const achievement = achievements.find(a => a.badgeId === unlock.badgeId);
            return {
                ...achievement?.toObject(),
                unlockedAt: unlock.unlockedAt
            };
        });

        res.status(200).json(unseenWithDetails);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unseen badges', error: error.message });
    }
};

module.exports = {
    getAllAchievements,
    getUserAchievements,
    getBadgeProgress,
    checkAndUnlockBadges,
    markNotificationSeen,
    getUnseenBadges
};
