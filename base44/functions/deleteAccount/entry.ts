import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();
    if (!currentUser) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (body.confirm !== true) {
      return Response.json({ error: 'Deletion must be explicitly confirmed' }, { status: 400 });
    }

    const userEmail = currentUser.email;
    const userId = currentUser.id;
    const admin = base44.asServiceRole;
    const entitiesToClean = [
      'DailyWheelSpin', 'DailyMission', 'PlayerCoins', 'HallOfFame', 'ZenPoints',
      'DartPopBlitzScore', 'CheckerCosmetic', 'UserProfile', 'GalleryPost',
      'DailyProgress', 'GameScore', 'SolitaireStats', 'PlayerXP', 'SavedGame',
      'EngagementStreak', 'Contact', 'PersonalEvent', 'PlayerInventory',
      'Achievement', 'EmergencyFund', 'JournalEntry', 'DailyLoginBonus',
    ];

    const deletionResults = {};
    let totalDeleted = 0;

    for (const entityName of entitiesToClean) {
      try {
        const records = await admin.entities[entityName].filter({ user_email: userEmail }, null, 5000);
        await admin.entities[entityName].deleteMany({ user_email: userEmail });
        deletionResults[entityName] = records.length;
        totalDeleted += records.length;
      } catch (error) {
        deletionResults[entityName] = `Error: ${error.message}`;
      }
    }

    try {
      await admin.entities.User.delete(userId);
      deletionResults.User = 'deleted';
    } catch (error) {
      deletionResults.User = `Error: ${error.message}`;
    }

    return Response.json({
      success: true,
      message: 'Account and all associated data deleted successfully',
      totalRecordsDeleted: totalDeleted,
      deletedData: deletionResults,
    });
  } catch (error) {
    return Response.json({ error: 'Failed to delete account', details: error.message }, { status: 500 });
  }
}