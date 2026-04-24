import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import useAuthStore from '../store/useAuthStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { Loading } from '../components';
import { socketService } from '../services/socket.service';
import useMatchStore from '../store/useMatchStore';
import useChatStore from '../store/useChatStore';

export default function AppNavigator() {
  const { isAuthenticated, isLoading, loadStoredAuth, user } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Connect/disconnect socket based on auth
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect().then(() => {
        // Listen for new matches
        socketService.on('newMatch', ({ match }) => {
          useMatchStore.getState().addMatch(match);
        });

        // Listen for new messages (global — for unread badges)
        socketService.on('newMessage', ({ matchId, message }) => {
          useChatStore.getState().incrementUnread(matchId);
        });
      });
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.off('newMatch');
      socketService.off('newMessage');
    };
  }, [isAuthenticated]);

  if (isLoading) return <Loading />;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
