// src/components/common/NavigationComponents.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useRouteContext } from '../../contexts/RouteContext';

// Drop-in replacement for react-router's Link
export const Link = ({ to, children, ...props }) => {
  const { getFullPath } = useRouteContext();
  
  // If the path already has a base (starts with /) or is external, use it as is
  const fullPath = to.startsWith('/') || to.startsWith('http') ? to : getFullPath(to);
  
  return (
    <RouterLink to={fullPath} {...props}>
      {children}
    </RouterLink>
  );
};

// Navigation helper function to use instead of navigate()
export const useNavigation = () => {
  const { navigateTo } = useRouteContext();
  
  return {
    navigate: navigateTo
  };
};