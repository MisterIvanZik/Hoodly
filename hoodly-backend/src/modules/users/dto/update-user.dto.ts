import { IsEnum, IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Rôle', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Compte actif' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Téléphone' })
  @IsOptional()
  @IsString()
  phone?: string;
}
