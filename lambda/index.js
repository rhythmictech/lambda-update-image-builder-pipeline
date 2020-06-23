const AWS = require('aws-sdk')
const semver = require('semver')

const imagebuilder = new AWS.Imagebuilder()

exports.handler = async (event, context) => {
  const amiArn = event.Records[0].Sns.Message.arn

  const pipeline = (await imagebuilder.getImagePipeline({
    imagePipelineArn: process.env.PIPELINE_ARN
  }).promise()).imagePipeline

  const oldRecipe = (await imagebuilder.getImageRecipe({
    imageRecipeArn: pipeline.imageRecipeArn
  }).promise()).imageRecipe

  const newRecipe = (await imagebuilder.createImageRecipe({
    name: oldRecipe.name,
    description: oldRecipe.description,
    semanticVersion: semver.inc(oldRecipe.version, 'patch'),
    components: oldRecipe.components,
    parentImage: amiArn,
    blockDeviceMappings: oldRecipe.blockDeviceMappings,
    tags: oldRecipe.tags,
    workingDirectory: oldRecipe.workingDirectory
  }).promise()).imageRecipeArn

  await imagebuilder.updateImagePipeline({
    imagePipelineArn: process.env.PIPELINE_ARN,
    imageRecipeArn: newRecipe,
    infrastructureConfigurationArn: pipeline.infrastructureConfigurationArn,
    description: pipeline.description,
    distributionConfigurationArn: pipeline.distributionConfigurationArn,
    enhancedImageMetadataEnabled: pipeline.enhancedImageMetadataEnabled,
    imageTestsConfiguration: pipeline.imageTestsConfiguration,
    schedule: pipeline.schedule,
    status: pipeline.status
  })

  return {
    newAMI: amiArn,
    newRecipeArn: newRecipe,
    logStream: context.logStreamName
  }
}
