"use client";

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import StoreIcon from "@mui/icons-material/Store";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import Nav from "@/components/Nav";
import { useRouter } from "next/navigation";

const EmployeeLogin = () => {
  const router = useRouter();

  const roles = [
    {
      name: "Super Admin",
      path: "/employee_login/superAdmin",
      icon: <SupervisorAccountIcon sx={{ fontSize: 40, color: "#e0f2f1" }} />,
      description: "Oversee all shops and administrative tasks.",
    },
    {
      name: "Manager",
      path: "/employee_login/manager",
      icon: <StoreIcon sx={{ fontSize: 40, color: "#e0f2f1" }} />,
      description: "Manage shop inventory, orders, and staff.",
    },
    {
      name: "Product Head",
      path: "/employee_login/productHead",
      icon: <BusinessCenterIcon sx={{ fontSize: 40, color: "#e0f2f1" }} />,
      description: "Oversee product management across assigned shops.",
    },
    {
      name: "Delivery Assistant",
      path: "/employee_login/delivery_assistant",
      icon: <LocalShippingIcon sx={{ fontSize: 40, color: "#e0f2f1" }} />,
      description: "View and manage assigned delivery tasks.",
    },
  ];

  // Styles
  const cardStyle = {
    cursor: "pointer",
    minHeight: "240px",
    padding: "1.5rem",
    borderRadius: "24px",
    background: "rgba(255, 255, 255, 0.12)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    color: "#000",
  };

  const cardHoverStyle = {
    transform: "translateY(-8px)",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)",
  };

  const contentStyle = {
    textAlign: "center",
    color: "#000",
  };

  const titleStyle = {
    color: "#000",
    fontWeight: "bold",
    marginBottom: "0.5rem",
  };

  const descriptionStyle = {
    color: "#000",
  };

  return (
    <div>
      <Nav navType="landing" />
      <Container style={{ marginTop: "2rem" }}>
        <Box textAlign="center" my={4}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ color: "#004d40", fontWeight: "bold" }}>
            Employee Portal
          </Typography>
          <Typography variant="h6" sx={{ color: "#333" }}>
            Please select your role to login.
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          {roles.map((role) => (
            <Grid
              item
              key={role.name}
              xs={12}
              sm={6}
              md={3}
              display="flex"
              justifyContent="center"
            >
              <Card
                sx={{
                  ...cardStyle,
                  "&:hover": cardHoverStyle,
                }}
                onClick={() => router.push(role.path)}
              >
                <CardContent sx={contentStyle}>
                  <Box mb={2}>{role.icon}</Box>
                  <Typography variant="h5" sx={titleStyle}>
                    {role.name}
                  </Typography>
                  <Typography variant="body2" sx={descriptionStyle}>
                    {role.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  );
};

export default EmployeeLogin;
