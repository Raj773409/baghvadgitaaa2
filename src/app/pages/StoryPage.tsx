import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { StoryExperience } from '../../components/story/StoryExperience';
import { useI18n } from '../../i18n';
import { parseStorySceneParam } from '../../utils/storyState';

export const StoryPage: React.FC = () => {
  const { t } = useI18n();
  const location = useLocation();
  const initialSceneIndex = parseStorySceneParam(location.search);
  const autoStart = new URLSearchParams(location.search).get('autostart') === '1';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = t('story.metaTitle');
    return () => {
      document.title = previousTitle;
    };
  }, [t]);

  return <StoryExperience initialSceneIndex={initialSceneIndex} autoStart={autoStart} />;
};

export default StoryPage;
