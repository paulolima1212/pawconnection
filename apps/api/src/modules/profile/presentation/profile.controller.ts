import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../shared/presentation/decorators/current-user.decorator';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import { DeleteAccountUseCase } from '../application/delete-account.use-case';
import {
  CompleteOnboardingUseCase,
  GetMyProfileUseCase,
  GetPublicProfileByHandleUseCase,
  SetUserInterestsUseCase,
  SetUserLookingForUseCase,
  UpdateOwnerProfileUseCase,
  UpdatePetProfileUseCase,
  toProfileResponse,
} from '../application/profile.use-cases';
import {
  SetInterestsDto,
  SetLookingForDto,
  UpdateOwnerDto,
  UpdatePetDto,
} from './profile.dto';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly getMyProfile: GetMyProfileUseCase,
    private readonly getPublicProfile: GetPublicProfileByHandleUseCase,
    private readonly updateOwner: UpdateOwnerProfileUseCase,
    private readonly updatePet: UpdatePetProfileUseCase,
    private readonly setInterests: SetUserInterestsUseCase,
    private readonly setLookingFor: SetUserLookingForUseCase,
    private readonly completeOnboarding: CompleteOnboardingUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,
    private readonly supabase: SupabaseService,
  ) {}

  private withPublicMediaUrls(
    profile: Awaited<ReturnType<GetMyProfileUseCase['execute']>>,
  ) {
    const response = toProfileResponse(profile);
    return {
      ...response,
      owner: {
        ...response.owner,
        photoUrl: this.supabase.normalizePublicUrl(response.owner.photoUrl),
      },
      pet: response.pet
        ? {
            ...response.pet,
            photoUrl: this.supabase.normalizePublicUrl(response.pet.photoUrl),
          }
        : null,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() user: AuthUserPayload) {
    const profile = await this.getMyProfile.execute(user.userId);
    return this.withPublicMediaUrls(profile);
  }

  @Get('public/:handle')
  @UseGuards(OptionalJwtAuthGuard)
  async publicProfile(
    @Param('handle') handle: string,
    @CurrentUser() user?: AuthUserPayload,
  ) {
    const result = await this.getPublicProfile.execute(handle, user?.userId);
    return {
      ...this.withPublicMediaUrls(result.user),
      blockedByMe: result.blockedByMe,
    };
  }

  @Patch('me/owner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async patchOwner(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateOwnerDto,
  ) {
    const profile = await this.updateOwner.execute(user.userId, dto);
    return this.withPublicMediaUrls(profile);
  }

  @Patch('me/pet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async patchPet(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdatePetDto,
  ) {
    await this.updatePet.execute(user.userId, dto);
    const profile = await this.getMyProfile.execute(user.userId);
    return this.withPublicMediaUrls(profile);
  }

  @Put('me/interests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async putInterests(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: SetInterestsDto,
  ) {
    const profile = await this.setInterests.execute(
      user.userId,
      dto.interests,
    );
    return this.withPublicMediaUrls(profile);
  }

  @Put('me/looking-for')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async putLookingFor(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: SetLookingForDto,
  ) {
    const profile = await this.setLookingFor.execute(
      user.userId,
      dto.lookingFor,
    );
    return this.withPublicMediaUrls(profile);
  }

  @Post('me/onboarding/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async postCompleteOnboarding(@CurrentUser() user: AuthUserPayload) {
    const profile = await this.completeOnboarding.execute(user.userId);
    return this.withPublicMediaUrls(profile);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteMe(@CurrentUser() user: AuthUserPayload) {
    await this.deleteAccount.execute(user.userId);
  }
}
