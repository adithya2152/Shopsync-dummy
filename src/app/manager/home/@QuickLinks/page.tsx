"use client";

import Card from "@/components/dashCard";
import { Typography, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Inventory, Receipt, People, ChevronRight, Assessment } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import NextLink from 'next/link';

const QuickLinkItem = styled(ListItem)(({ theme }) => ({
    padding: theme.spacing(1.5, 2),
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    // The cursor is on the wrapper now, but this is fine as a fallback
    cursor: 'pointer', 
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: theme.shape.borderRadius,
        transform: 'translateX(5px)',
    }
}));

export default function QuickLinks() {
  const links = [
    {
      text: 'Manage Inventory',
      href: '/manager/inventory',
      icon: <Inventory />,
      description: 'Add, edit, and track product stock levels.'
    },
    {
      text: 'View Orders',
      href: '/manager/orders',
      icon: <Receipt />,
      description: 'Process new orders and view order history.'
    },
    {
      text: 'View Deliveries',
      href: '/manager/deliveries', 
      icon: <Assessment />,
      description: 'Track and manage deliveries.'
    },
    {
      text: 'Manage Employees',
      href: '/manager/employeeManagement',
      icon: <People />,
      description: 'Add or remove staff and manage roles.'
    },
  ];

  return (
    <Card>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Quick Links
      </Typography>
      <List dense>
          {links.map(link => (
              // ✅ FIX: Wrap the component with NextLink
              <NextLink 
                href={link.href} 
                key={link.text} 
                passHref 
                legacyBehavior
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <QuickLinkItem>
                  <ListItemIcon sx={{ color: '#054116', minWidth: '40px' }}>{link.icon}</ListItemIcon>
                  <ListItemText
                    primary={link.text}
                    secondary={link.description}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                  <ChevronRight />
                </QuickLinkItem>
              </NextLink>
          ))}
      </List>
    </Card>
  );
}