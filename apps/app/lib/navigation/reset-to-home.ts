import { CommonActions } from '@react-navigation/native';

export const homeResetAction = CommonActions.reset({
  index: 0,
  routes: [
    {
      name: '(main)',
      state: {
        index: 0,
        routes: [{ name: 'social-feed' }],
      },
    },
  ],
});

type Dispatchable = {
  dispatch: (action: typeof homeResetAction) => void;
};

export function resetNavigationToHome(navigation: Dispatchable | null | undefined) {
  navigation?.dispatch(homeResetAction);
}
