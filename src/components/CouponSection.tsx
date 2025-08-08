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
import "../styles/CouponDisplaySection.css"; // Ensure this CSS file is imported

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
    shopName?: string;
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
        // Use the modern clipboard API with a fallback for security/iframe restrictions
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code);
        } else {
            // Fallback for insecure contexts or older browsers
            const textArea = document.createElement("textarea");
            textArea.value = code;
            textArea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        
        setCopiedCode(code);
        setTimeout(() => {
            setCopiedCode(null);
        }, 2000); // Reset copiedCode after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Helper function to render the list of coupons
  const renderCoupons = () => {
    return coupons.map(coupon => {
      const isCopied = copiedCode === coupon.code;

      return (
        <Card
          id={`coupon-${coupon.id}`}
          key={coupon.id}
          raised={true}
          sx={{
            minWidth: 280,
            maxWidth: 320,
            flexShrink: 0, // Prevent cards from shrinking
            borderRadius: '12px',
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.12)'
            },
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #ffffff 0%, #f7f8fa 100%)',
            mx: 2, // Add horizontal margin
          }}
        >
          {/* Main content of the coupon */}
          <CardContent sx={{ flexGrow: 1, paddingBottom: '8px' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', minHeight: '56px' }}>
              {coupon.name || "Special Offer"}
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 2, minHeight: '40px' }}>
              {coupon.description || "Use this coupon to get a discount."}
            </Typography>
            {coupon.shopName && (
            <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
              Store: {coupon.shopName}
            </Typography>
            )
            }
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
            {!coupon.shopName ? (
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
            ) : (
              <Button
                variant="contained"
                size="small"
                href={`/shop/${coupon.shopId}`}
              >
                Visit Shop
              </Button>
            )}
          </Box>
        </Card>
      );
    });
  };

  // If there are no coupons, don't render the section
  if (!coupons || coupons.length === 0) {
    return null;
  }

  // Calculate a dynamic animation duration. 
  // More coupons = longer duration, so the speed is consistent.
  // We'll use 5 seconds per coupon as a baseline.
  const animationDuration = coupons.length * 3;

  return (
    <div className="marquee-container">
      <div
        className="marquee"
        style={{ animationDuration: `${animationDuration}s` }}
      >
        {renderCoupons()}
        {renderCoupons()} {/* Render the coupons a second time for a seamless loop */}
      </div>
    </div>
  );
}
