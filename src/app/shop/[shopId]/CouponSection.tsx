"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
} from "@mui/material";
import { ContentCopy, CheckCircle } from '@mui/icons-material';

export interface Coupon {
    id: number;
    shopId: number;
    name: string | null;
    description: string | null;
    public: boolean;
    code: string;
    uses: number;
    maxUses: number;
    discountType: string;
    discountValue: string;
    minAmount: string;
};


interface CouponSectionProps {
    coupons: Coupon[];
}

export default function CouponDisplaySection({ coupons }: CouponSectionProps) {
  // State to manage which coupon's code has been copied
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Function to handle copying the coupon code
  const handleCopy = (code: string) => {
      try {
      navigator.clipboard.writeText(code)
      setCopiedCode(code);
        setTimeout(() => {
            setCopiedCode(null);
            }, 2000); // Reset copiedCode after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };



  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px", // Increased gap for better spacing
          justifyContent: "center",
          padding: "20px", // Added padding to the container
        }}
      >
        {coupons.map(coupon => {
          const isCopied = copiedCode === coupon.code;

          return (
            <Card
              id={`coupon-${coupon.id}`}
              key={coupon.id}
              raised={true}
              sx={{
                minWidth: 280,
                maxWidth: 320,
                flexGrow: 1,
                borderRadius: '12px',
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.12)'
                },
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #ffffff 0%, #f7f8fa 100%)',
              }}
            >
              {/* Main content of the coupon */}
              <CardContent sx={{ flexGrow: 1, paddingBottom: '8px' }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {coupon.name || "Special Offer"}
                </Typography>
                <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 2, minHeight: '40px' }}>
                  {coupon.description || "Use this coupon to get a discount."}
                </Typography>
              </CardContent>

              {/* Dashed line separator */}
              <Divider sx={{ borderStyle: 'dashed', mx: 2 }} />

              {/* Coupon code and copy button area */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, backgroundColor: 'rgba(26, 35, 126, 0.03)', borderRadius: '0 0 12px 12px' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    fontFamily: 'monospace',
                    color: '#3f51b5',
                    border: '1px dashed #3f51b5',
                    padding: '6px 12px',
                    borderRadius: '6px',
                  }}
                >
                  {coupon.code}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleCopy(coupon.code)}
                  disabled={isCopied}
                  startIcon={isCopied ? <CheckCircle /> : <ContentCopy />}
                  sx={{
                    transition: 'all 0.3s ease',
                    backgroundColor: isCopied ? '#4caf50' : '#3f51b5',
                    '&:hover': {
                      backgroundColor: isCopied ? '#4caf50' : '#303f9f',
                    },
                    color: 'white',
                  }}
                >
                  {isCopied ? "Copied" : "Copy"}
                </Button>
              </Box>
            </Card>
          );
        })}
      </div>

    </>
  );
}
