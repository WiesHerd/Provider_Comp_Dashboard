// Using Prisma as our ORM
model Provider {
  id            String   @id @default(cuid())
  employeeId    String   @unique
  firstName     String
  lastName      String
  specialty     String?
  compensationChanges CompensationChange[]
}

model CompensationChange {
  id               String   @id @default(cuid())
  effectiveDate    DateTime
  previousSalary   Float
  newSalary        Float
  previousFTE      Float
  newFTE           Float
  conversionFactor Float
  reason           String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  providerId       String
  provider         Provider @relation(fields: [providerId], references: [id])

  @@index([providerId, effectiveDate])
} 