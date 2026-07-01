import { PartialType } from '@nestjs/swagger';
import { CreateSupportContactDto } from './create-support-contact.dto';

export class UpdateSupportContactDto extends PartialType(CreateSupportContactDto) {}
