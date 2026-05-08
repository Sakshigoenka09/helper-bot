const { supabase } = require('../db/supabase');

async function saveSlackInstallation(installation) {
  const payload = {
    team_id: installation.teamId,
    team_name: installation.teamName,
    bot_token: installation.botToken,
    bot_user_id: installation.botUserId,
    scope: installation.scope,
    authed_user_id: installation.authedUserId,
    installed_at: new Date().toISOString(),
    raw_response: installation.rawResponse,
  };

  const { error } = await supabase
    .from('slack_installations')
    .upsert(payload, { onConflict: 'team_id' });

  if (error) {
    throw error;
  }

  return payload;
}

async function getSlackInstallationByTeamId(teamId) {
  const { data, error } = await supabase
    .from('slack_installations')
    .select('*')
    .eq('team_id', teamId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }

    throw error;
  }

  return data;
}

async function listSlackInstallations() {
  const { data, error } = await supabase
    .from('slack_installations')
    .select('*')
    .order('installed_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

module.exports = {
  getSlackInstallationByTeamId,
  listSlackInstallations,
  saveSlackInstallation,
};
